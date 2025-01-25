const Leave = require("../models/Leave");
const User = require("../models/User");
const Notification = require("../models/Notification");

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
    try {
      // Fetch the leave by ID
      const leave = await Leave.findById(id).lean();

      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }

      // Fetch the user details for the leaveEmployee
      const user = await User.findById(
        leave.leaveEmployee,
        "userFullName"
      ).lean();

      // Attach the employee's name to the leave object
      leave.leaveEmployeeName = user?.userFullName || null;

      // Return the leave as an array to maintain consistency with client-side handling
      return res.json([leave]);
    } catch (error) {
      console.error("Error fetching leave details:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while fetching leave details" });
    }
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
// Function to determine if dates fall into different months and generate leave objects
const generateLeaveObjects = (leaveStartDate, leaveEndDate, leaveDetails) => {
  const startDate = new Date(leaveStartDate);
  const endDate = new Date(leaveEndDate);

  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return [
      {
        ...leaveDetails,
        leaveMonth: startDate.toLocaleString("default", { month: "long" }),
        leaveStartDate: startDate,
        leaveEndDate: endDate,
      },
    ];
  } else {
    const endOfStartMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    );
    const startOfEndMonth = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      1
    );

    return [
      {
        ...leaveDetails,
        leaveMonth: startDate.toLocaleString("default", { month: "long" }),
        leaveStartDate: startDate,
        leaveEndDate: endOfStartMonth,
      },
      {
        ...leaveDetails,
        leaveMonth: endDate.toLocaleString("default", { month: "long" }),
        leaveStartDate: startOfEndMonth,
        leaveEndDate: endDate,
      },
    ];
  }
};

// Function to check for overlapping leaves
const hasOverlap = async (employeeId, startDate, endDate) => {
  const overlappingLeaves = await Leave.find({
    leaveEmployee: employeeId,
    $or: [
      {
        leaveStartDate: { $lte: endDate },
        leaveEndDate: { $gte: startDate },
      },
    ],
  });

  return overlappingLeaves.length > 0;
};
//----------------------------------------------------------------------------------
// @desc Create new leave
// @route POST 'desk/leave
// @access Private
const createNewLeave = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    leaveYear,
    //leaveMonth,
    leaveEmployee,
    leaveIsGiven,
    leaveIsPaidLeave,
    leaveIsSickLeave,
    leaveIsPartDay,
    leaveStartDate,
    leaveEndDate,
    leaveStartTime,
    leaveEndTime,

    leaveComment,
    leaveOperator,
    leaveCreator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here
  //console.log(leaveItems,'1')
  //Confirm data is present in the request with all required fields

  if (
    !leaveYear ||
    //!leaveMonth ||
    !leaveEmployee ||
    !leaveStartDate ||
    !leaveEndDate ||
    !leaveOperator ||
    !leaveCreator
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }
  try {
    // Common leave details
    const leaveDetails = {
      leaveYear,
      leaveEmployee,
      leaveIsGiven,
      leaveIsPaidLeave,
      leaveIsSickLeave,
      leaveIsPartDay,
      leaveComment,
      leaveOperator,
      leaveCreator,
    };

    // Check for overlap with existing leaves
    const hasExistingOverlap = await hasOverlap(
      leaveEmployee,
      new Date(leaveStartDate),
      new Date(leaveEndDate)
    );

    if (hasExistingOverlap) {
      return res
        .status(400)
        .json({ message: "Leave dates overlap with existing leaves" });
    }

    // Generate leave objects
    const leaveObjects = generateLeaveObjects(
      leaveStartDate,
      leaveEndDate,
      leaveDetails
    );

    // Create and store the leave(s)
    const createdLeaves = await Promise.all(
      leaveObjects.map((leaveObject) => Leave.create(leaveObject))
    );

    // Check if all leaves were created successfully
    if (createdLeaves.some((leave) => !leave)) {
      return res
        .status(400)
        .json({ message: "Invalid data received for leave creation" });
    }
    // If created
    //create the notification
    //find the employee name
    const employee = await User.findById(leaveEmployee).exec();
    const notificationContent = `A new ${leaveIsPaidLeave ? "paid" : "unpaid"}${
      leaveIsSickLeave ? "sick" : ""
    }leave for ${employee?.userFullName?.userFirstName} ${" "}${
      employee?.userFullName?.userMiddleName
    } ${" "}${employee?.userFullName?.userLastName} ${" "}
   from  ${" "}${leaveStartDate?.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}${" "} to ${" "}${leaveEndDate?.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })} was recorded`;

    const notificationExcerpt =  `A new ${leaveIsPaidLeave ? "paid" : "unpaid"}${
      leaveIsSickLeave ? "sick" : ""
    }leave for ${employee?.userFullName?.userFirstName} ${" "}${
      employee?.userFullName?.userMiddleName
    } ${" "}${employee?.userFullName?.userLastName} ${" "}
   from  ${" "}${leaveStartDate?.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}${" "} to ${" "}${leaveEndDate?.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })} was recorded`;

    //get the id of active managers, director, admin
    const targetRoles = ["Director", "Manager", "Admin"]; // Roles to filter by

    // Find users with matching roles and populate employeeId
    const usersWithRoles = await User.find({
      userRoles: { $in: targetRoles },
    })
      .populate({
        path: "employeeId",
        select: "employeeIsActive", // Only include employeeIsActive in the populated field
      })
      .lean();

    // Filter users where employeeIsActive is true
    const targetUsers = usersWithRoles
      .filter((user) => user?.employeeId?.employeeIsActive)
      .map((user) => user._id); // Extract user._id for active employees

    //console.log("Target Users:", targetUsers);

    const newNotification = {
      notificationYear: leaveYear,
      notificationToUsers: targetUsers, //the user id who will receive
      notificationType: "Leave",
      notificationLeave: createdLeaves[0]._id,
      notificationTitle: "New Leave",
      notificationContent: notificationContent,
      notificationExcerpt: notificationExcerpt,
      notificationDate: new Date(),
      notificationIsToBeSent: false,
      notificationIsRead: [],
    };
    //console.log(newNotification,'newNotification')
    const savedNotification = await Notification.create(newNotification);

    return res.status(201).json({ message: "Leave created successfully" });
  } catch (error) {
    console.error("Error creating leaves:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while creating leaves" });
  }
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
    leaveStartTime,
    leaveEndTime,
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
  try {
    // Does the leave exist to update?
    const leaveToUpdate = await Leave.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

    if (!leaveToUpdate) {
      return res.status(400).json({ message: "Leave to update not found" });
    }

    // Function to check for overlapping leaves
    const hasOverlap = async (employeeId, startDate, endDate, excludeId) => {
      const overlappingLeaves = await Leave.find({
        leaveEmployee: employeeId,
        _id: { $ne: excludeId }, // Exclude the current leave
        $or: [
          {
            leaveStartDate: { $lte: endDate },
            leaveEndDate: { $gte: startDate },
          },
        ],
      });

      return overlappingLeaves.length > 0;
    };
    // Check for overlapping leaves
    const hasExistingOverlap = await hasOverlap(
      leaveEmployee,
      new Date(leaveStartDate),
      new Date(leaveEndDate),
      id
    );

    if (hasExistingOverlap) {
      return res
        .status(400)
        .json({ message: "Leave dates overlap with existing leaves" });
    }
    // Function to generate leave objects
    const generateLeaveObjects = (
      leaveStartDate,
      leaveEndDate,
      leaveDetails
    ) => {
      const startDate = new Date(leaveStartDate);
      const endDate = new Date(leaveEndDate);

      if (
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getFullYear() === endDate.getFullYear()
      ) {
        return [
          {
            ...leaveDetails,
            leaveMonth: startDate.toLocaleString("default", { month: "long" }),
            leaveStartDate: startDate,
            leaveEndDate: endDate,
          },
        ];
      } else {
        const endOfStartMonth = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          0
        );
        const startOfEndMonth = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          1
        );

        return [
          {
            ...leaveDetails,
            leaveMonth: startDate.toLocaleString("default", { month: "long" }),
            leaveStartDate: startDate,
            leaveEndDate: endOfStartMonth,
          },
          {
            ...leaveDetails,
            leaveMonth: endDate.toLocaleString("default", { month: "long" }),
            leaveStartDate: startOfEndMonth,
            leaveEndDate: endDate,
          },
        ];
      }
    };
    // Generate updated leave objects
    const leaveDetails = {
      leaveYear,
      leaveEmployee,
      leaveIsGiven,
      leaveIsPaidLeave,
      leaveIsSickLeave,
      leaveIsPartDay,
      leaveComment,
      leaveOperator,
    };

    const leaveObjects = generateLeaveObjects(
      leaveStartDate,
      leaveEndDate,
      leaveDetails
    );

    // Start a session to update leaves transactionally
    const session = await Leave.startSession();
    session.startTransaction();

    try {
      // Delete the existing leave
      await Leave.deleteOne({ _id: id }, { session });

      // Create updated leave objects
      const createdLeaves = await Promise.all(
        leaveObjects.map((leaveObject) =>
          Leave.create([leaveObject], { session })
        )
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return res
        .status(200)
        .json({ message: "Leave updated successfully", createdLeaves });
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      session.endSession();
      console.error("Error updating leave:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while updating leave" });
    }
  } catch (error) {
    console.error("Error in updateLeave controller:", error);
    return res.status(500).json({ message: "Server error" });
  }
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
