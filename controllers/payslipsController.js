const Payslip = require("../models/Payslip");
const User = require("../models/User");
const Leave= require("../models/Leave");
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

//for payslips list component
const getPayslipsByYear = async (selectedYear) => {
  try {
    // Fetch payslips with the required employee and user data
    const payslips = await Payslip.find({ payslipYear: selectedYear })
      .populate({
        path: 'payslipEmployee', // Populate the employee field
        select: 'employeeCurrentEmployment' // Only select the necessary field
      })
      .populate({
        path: 'payslipLeaveDays', // Populate the employee field
        select: '-leaveOperator -leaveCreator -leaveEmployee -leaveYear -leaveMonth' // Only select the necessary fields
      })
      .lean(); // Convert documents to plain JavaScript objects for easier manipulation
      // Add user information for each employee
      for (const payslip of payslips) {
        if (payslip?.payslipEmployee) {
          const user = await User.findOne(
            { employeeId: payslip?.payslipEmployee }, // Match the employee ID
            'userFullName' // Select only the userFullName field
          ).lean();
         // console.log(user,'user')

        // Attach user information to the payslip
        payslip.payslipEmployee.userFullName = user ? user.userFullName : null;
      }
    }

    return payslips;
  } catch (error) {
    console.error('Error fetching payslips:', error);
    throw error;
  }
};




//helper for finances stats
const getPayslipsStats = async (selectedYear) => {
  try {
    const result = await Payslip.aggregate([
      {
        $match: { payslipYear: selectedYear } // Filter invoices by the selected year
      },
      {
        $addFields: {
          payslipAmountAsNumber: { $toDouble: "$payslipAmount" } // Convert string to number
        }
      },
      {
        $group: {
          _id: null, // No grouping required
          totalPayslipsAmount: { $sum: "$payslipAmountAsNumber" } // Sum converted values
        }
      }
    ]);

    // If no results, return 0
    const totalAmount = result.length > 0 ? result[0].totalPayslipsAmount : 0;
    return totalAmount;
  } catch (error) {
    console.error("Error computing invoices sum:", error);
    throw error;
  }
};





















// @desc Get all payslip
// @route GET 'desk/payslip
// @access Private // later we will establish authorisations
const getAllPayslips = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;
  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

    // Find a single payslip by its ID
    const payslip = await Payslip.findOne({ _id: id })
     
      .lean();

    if (!payslip) {
      return res.status(400).json({ message: "Payslip not found" });
    }

    // Return the payslip inside an array
    return res.json([payslip]); //we need it inside  an array to avoid response data error
  }

  if (selectedYear !== "1000" && criteria==="payslipsTotalStats") {

    try {
      const totalPayslipsAmount = await getPayslipsStats(selectedYear);
  
      return res.status(200).json({
        message: "payslips and total amount retrieved successfully",
        selectedYear,
        totalPayslipsAmount
      });
    } catch (error) {
     return  res.status(500).json({
        message: "Error retrieving payslips",
        error: error.message
      });
    }
  };
  if (selectedYear !== "1000") {
    // Find a single payslip by its ID
    const payslips = await getPayslipsByYear(selectedYear)
    //console.log(payslips,'payslips')

    if (!payslips) {
      return res.status(400).json({ message: "Payslips not found" });
    }

    // Return the payslip inside an array
    return res.json(payslips); //we need it inside  an array to avoid response data error
  }

  
  // If no ID is provided, fetch all payslips
});

//----------------------------------------------------------------------------------
// @desc Create new payslip
// @route POST 'desk/payslip
// @access Private
const createNewPayslip = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    payslipYear,
    payslipMonth,
    payslipAmount,
    payslipNote,
    payslipCategory,
    payslipItems,
    payslipPayee,
    payslipService,
    payslipDate,
    payslipPaymentDate,
    payslipMethod,
    payslipOperator,
    payslipCreator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here
//console.log(payslipItems,'1')
  //Confirm data is present in the request with all required fields

  if (
    !payslipYear ||
    !payslipMonth ||
    !payslipAmount ||
    !payslipCategory||
    !payslipItems||
    payslipItems?.length<1 ||
    !payslipPayee ||
    !payslipService ||
    !payslipCreator||
    !payslipDate||
    !payslipMethod||
    !payslipCreator
  ) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

 

  const payslipObject = {
    payslipYear:payslipYear,
    payslipMonth:payslipMonth,
    payslipAmount:payslipAmount,
    payslipNote:payslipNote,
    payslipCategory:payslipCategory,
    payslipItems:payslipItems,
    payslipPayee:payslipPayee,
    payslipService:payslipService,
    payslipDate:payslipDate,
    payslipPaymentDate:payslipPaymentDate,
    payslipMethod :payslipMethod,
    payslipOperator :payslipOperator,
    payslipCreator:payslipCreator,
  }; //construct new payslip to be stored

  // Create and store new payslip
  const payslip = await Payslip.create(payslipObject);
  if (!payslip) {
    return res
      .status(400)
      .json({ message: "Invalid payslip data received No payslip saved" });
  }
  // If created 
  //console.log(payslip?.payslipItems,'2')
  return res.status(201).json({
    message: `New payslip  ${payslip.payslipMonth} for  ${payslip.payslipAmount} on  ${payslip.payslipDate} `,
  });
});

// @desc Update a payslip
// @route PATCH 'desk/payslip
// @access Private
const updatePayslip = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that payslip in any other, the latter will have an ending date
  const {
    id,
    payslipYear,
        payslipMonth,
        payslipAmount,
        payslipNote,
        payslipCategory,
        payslipItems,
        payslipPayee,
        payslipDate,
        payslipPaymentDate,
        payslipService,
        payslipMethod,
        payslipOperator,
  } = req?.body;

  // Confirm data
  if (!id||
    !payslipYear ||
    !payslipMonth ||
    !payslipAmount ||
    !payslipCategory||
    !payslipItems||
    payslipItems?.length<1 ||
    !payslipPayee ||
    !payslipService ||
   
    !payslipDate||
    !payslipMethod
    
  ){
    return res.status(400).json({ message: "All mandatory fields required" });
  }
  
  // Does the payslip exist to update?
  const payslipToUpdate = await Payslip.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!payslipToUpdate) {
    return res.status(400).json({ message: "Payslip to update not found" });
  }
 
  payslipToUpdate.payslipYear=payslipYear
  payslipToUpdate.payslipMonth=payslipMonth
  payslipToUpdate.payslipAmount=payslipAmount
  payslipToUpdate.payslipCategory=payslipCategory
  payslipToUpdate.payslipItems=payslipItems
  payslipToUpdate.payslipPayee=payslipPayee
  payslipToUpdate.payslipService=payslipService
  payslipToUpdate.payslipDate=payslipDate
  payslipToUpdate.payslipMethod=payslipMethod
  payslipToUpdate.payslipNote=payslipNote
  payslipToUpdate.payslipPaymentDate=payslipPaymentDate
  //payslipToUpdate.payslipCategories=payslipCategories
  payslipToUpdate.payslipOperator=payslipOperator


 
    //console.log(payslipToUpdate,'payslipToUpdate')
    const updatedPayslip = await payslipToUpdate.save(); //save old payslip
    if (!updatedPayslip) {
      return res.status(400).json({ message: "invalid payslip data received" });
    }
      return res.status(201).json({
        message: `Payslip: of ${updatedPayslip.payslipAmount} updated `,
      })

 

});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deletePayslip = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Payslip ID Required" });
  }

  // Does the user exist to delete?
  const payslip = await Payslip.findById(id).exec();

  if (!payslip) {
    return res.status(400).json({ message: "Payslip to delete not found" });
  }

  // Delete the payslip
  const result = await payslip.deleteOne();

  const reply = `Payslip  ${payslip.payslipLabel}, with ID ${payslip._id}, deleted `;

  return res.json(reply);
});

module.exports = {
  getAllPayslips,
  createNewPayslip,
  updatePayslip,
  deletePayslip,
};
