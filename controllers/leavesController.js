const Leave = require("../models/Leave");
const User = require("../models/User");

const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

//helper for finances stats
const getLeavesStats = async (selectedYear) => {
  try {
    const result = await Leave.aggregate([
      {
        $match: { leaveYear: selectedYear }, // Filter invoices by the selected year
      },
      {
        $addFields: {
          leaveAmountAsNumber: { $toDouble: "$leaveAmount" }, // Convert string to number
        },
      },
      {
        $group: {
          _id: null, // No grouping required
          totalLeavesAmount: { $sum: "$leaveAmountAsNumber" }, // Sum converted values
        },
      },
    ]);

    // If no results, return 0
    const totalAmount = result.length > 0 ? result[0].totalLeavesAmount : 0;
    return totalAmount;
  } catch (error) {
    console.error("Error computing invoices sum:", error);
    throw error;
  }
};

//for leaves list component
const getLeavesByYear = async (selectedYear) => {
  try {
    // Fetch leaves with the required employee and user data
    const leaves = await Leave.find({ leaveYear: selectedYear })
      .populate({
        path: "leaveEmployee", // Populate the employee field
        select: "employeeCurrentEmployment", // Only select the necessary field
      })
      .lean(); // Convert documents to plain JavaScript objects for easier manipulation
    // Add user information for each employee
    for (const leave of leaves) {
      if (leave?.leaveEmployee) {
        const user = await User.findOne(
          { employeeId: leave?.leaveEmployee }, // Match the employee ID
          "userFullName" // Select only the userFullName field
        ).lean();
        // console.log(user,'user')

        // Attach user information to the leave
        leave.leaveEmployee.userFullName = user ? user.userFullName : null;
      }
    }

    return leaves;
  } catch (error) {
    console.error("Error fetching leaves:", error);
    throw error;
  }
};

// @desc Get all leave
// @route GET 'desk/leave
// @access Private // later we will establish authorisations
const getAllLeaves = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;
  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");
    const leave = await Leave.find({ _id: id }).lean();

    const user = await User.findOne(
      { employeeId: leave[0]?.leaveEmployee }, // Match the employee ID
      "userFullName" // Select only the userFullName field
    ).lean();

    // Attach user information to the leave
    leave[0].leaveEmployeeName = user ? user?.userFullName : null;
    if (!leave) {
      return res.status(400).json({ message: "Leave not found" });
    }
    // Return the leave inside an array
    return res.json(leave); //we need it inside  an array to avoid response data error
  }

  if (selectedYear !== "1000" && criteria === "leavesTotalStats") {
    try {
      const totalLeavesAmount = await getLeavesStats(selectedYear);

      return res.status(200).json({
        message: "leaves and total amount retrieved successfully",
        selectedYear,
        totalLeavesAmount,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error retrieving leaves",
        error: error.message,
      });
    }
  }
  if (selectedYear !== "1000") {
    // Find a single leave by its ID
    const leaves = await getLeavesByYear(selectedYear);
    if (!leaves) {
      return res.status(400).json({ message: "Leaves not found" });
    }

    // Return the leave inside an array
    return res.json(leaves); //we need it inside  an array to avoid response data error
  }

  // If no ID is provided, fetch all leaves
});

//----------------------------------------------------------------------------------
// @desc Create new leave
// @route POST 'desk/leave
// @access Private
const createNewLeave = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    leaveYear,
    leaveMonth,
    leaveEmployee,
    leaveIsGiven,
    leaveIsPaidLeave,
    leaveIsSickLeave,
    leaveIsPartDay,
    leaveStartDate,
    leaveEndDate,

    leaveComment,
    leaveOperator,
    leaveCreator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here
  //console.log(leaveItems,'1')
  //Confirm data is present in the request with all required fields

  if (
    !leaveYear ||
    !leaveMonth ||
    !leaveEmployee ||
    !leaveStartDate ||
    !leaveEndDate ||
    !leaveOperator ||
    !leaveCreator
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }

  const leaveObject = {
    leaveYear: leaveYear,
    leaveMonth: leaveMonth,
    leaveEmployee: leaveEmployee,
    leaveIsGiven: leaveIsGiven,
    leaveIsPaidLeave: leaveIsPaidLeave,
    leaveIsSickLeave: leaveIsSickLeave,
    leaveIsPartDay: leaveIsPartDay,
    leaveStartDate: leaveStartDate,
    leaveEndDate: leaveEndDate,

    leaveComment: leaveComment,
    leaveOperator: leaveOperator,
    leaveCreator: leaveCreator,
  }; //construct new leave to be stored

  // Create and store new leave
  const leave = await Leave.create(leaveObject);
  if (!leave) {
    return res.status(400).json({ message: "Invalid data received" });
  }
  // If created
  //console.log(leave?.leaveItems,'2')
  return res.status(201).json({
    message: `Leave created successfully`,
  });
});

// @desc Update a leave
// @route PATCH 'desk/leave
// @access Private
const updateLeave = asyncHandler(async (req, res) => {
  //no need for start timer and end timne because they are already included in teh start date and end date
  const {
    id,
    leaveYear,
    leaveMonth,
    leaveEmployee,
    leaveIsGiven,
    leaveIsPaidLeave,
    leaveIsSickLeave,
    leaveIsPartDay,
    leaveStartDate,
    leaveEndDate,

    leaveComment,
    leaveOperator,
  } = req?.body;
 
  // Confirm data
  if (
    !id ||
    !leaveYear ||
    !leaveMonth ||
    !leaveEmployee ||
    leaveIsGiven === undefined ||
    leaveIsPaidLeave === undefined ||
    leaveIsSickLeave === undefined ||
    leaveIsPartDay === undefined ||
    !leaveStartDate ||
    !leaveEndDate ||
    
    !leaveOperator
  ) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the leave exist to update?
  const leaveToUpdate = await Leave.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!leaveToUpdate) {
    return res.status(400).json({ message: "Leave to update not found" });
  }
  leaveToUpdate.leaveYear = leaveYear;
  leaveToUpdate.leaveMonth = leaveMonth;
  leaveToUpdate.leaveIsGiven = leaveIsGiven;
  leaveToUpdate.leaveIsPaidLeave = leaveIsPaidLeave;
  leaveToUpdate.leaveIsSickLeave = leaveIsSickLeave;
  leaveToUpdate.leaveIsPartDay = leaveIsPartDay;
  leaveToUpdate.leaveStartDate = leaveStartDate;
  leaveToUpdate.leaveEndDate = leaveEndDate;
  leaveToUpdate.leaveComment = leaveComment;
  leaveToUpdate.leaveOperator = leaveOperator;
  leaveToUpdate.leaveOperator = leaveOperator;

  //console.log(leaveToUpdate,'leaveToUpdate')
  const updatedLeave = await leaveToUpdate.save(); //save old leave
  if (!updatedLeave) {
    return res.status(400).json({ message: "invalid data received" });
  }
  return res.status(201).json({
    message: `Leave updated successfully`,
  });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteLeave = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the user exist to delete?
  const leave = await Leave.findById(id).exec();

  if (!leave) {
    return res.status(400).json({ message: "Leave to delete not found" });
  }

  // Delete the leave
  const result = await leave.deleteOne();

  const reply = `Deleted ${result?.deletedCount} leave`;

  return res.json({ message: reply });
});

module.exports = {
  getAllLeaves,
  createNewLeave,
  updateLeave,
  deleteLeave,
};
