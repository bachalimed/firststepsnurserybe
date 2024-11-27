const Expense = require("../models/Expense");
const Payee = require("../models/Payee");

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all expense
// @route GET 'desk/expense
// @access Private // later we will establish authorisations
const getAllExpenses = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;
  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

    // Find a single expense by its ID
    const expense = await Expense.findOne({ _id: id })
     
      .lean();

    if (!expense) {
      return res.status(400).json({ message: "Expense not found" });
    }

    // Return the expense inside an array
    return res.json([expense]); //we need it inside  an array to avoid response data error
  }
  if (selectedYear !== "1000") {
    // Find a single expense by its ID
    const expenses = await Expense.find()
    .populate({path:'expensePayee',select:'payeeLabel'})
    .populate({path:'expenseService', select:'serviceType'})
    .populate({path:'expenseCategory', select:'expenseCategoryLabel'})
    .lean();

    if (!expenses) {
      return res.status(400).json({ message: "Expenses not found" });
    }

    // Return the expense inside an array
    return res.json(expenses); //we need it inside  an array to avoid response data error
  }

  
  // If no ID is provided, fetch all expenses
});

//----------------------------------------------------------------------------------
// @desc Create new expense
// @route POST 'desk/expense
// @access Private
const createNewExpense = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    expenseYear,
    expenseMonth,
    expenseAmount,
    expenseNote,
    expenseCategory,
    expenseItems,
    expensePayee,
    expenseService,
    expenseDate,
    expensePaymentDate,
    expenseMethod,
    expenseOperator,
    expenseCreator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here
//console.log(expenseItems,'1')
  //Confirm data is present in the request with all required fields

  if (
    !expenseYear ||
    !expenseMonth ||
    !expenseAmount ||
    !expenseCategory||
    !expenseItems||
    expenseItems?.length<1 ||
    !expensePayee ||
    !expenseService ||
    !expenseCreator||
    !expenseDate||
    !expenseMethod||
    !expenseCreator
  ) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

 

  const expenseObject = {
    expenseYear:expenseYear,
    expenseMonth:expenseMonth,
    expenseAmount:expenseAmount,
    expenseNote:expenseNote,
    expenseCategory:expenseCategory,
    expenseItems:expenseItems,
    expensePayee:expensePayee,
    expenseService:expenseService,
    expenseDate:expenseDate,
    expensePaymentDate:expensePaymentDate,
    expenseMethod :expenseMethod,
    expenseOperator :expenseOperator,
    expenseCreator:expenseCreator,
  }; //construct new expense to be stored

  // Create and store new expense
  const expense = await Expense.create(expenseObject);
  if (!expense) {
    return res
      .status(400)
      .json({ message: "Invalid expense data received No expense saved" });
  }
  // If created 
  //console.log(expense?.expenseItems,'2')
  return res.status(201).json({
    message: `New expense  ${expense.expenseMonth} for  ${expense.expenseAmount} on  ${expense.expenseDate} `,
  });
});

// @desc Update a expense
// @route PATCH 'desk/expense
// @access Private
const updateExpense = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that expense in any other, the latter will have an ending date
  const {
    id,
    expenseLabel,
    expensePhone,
    expenseAddress,
    expenseNotes,
    expenseIsActive,
    expenseYears,
    //expenseCategories,
    expenseOperator,
  } = req?.body;

  // Confirm data
  if (
    !id ||
    expenseIsActive === undefined || // Checks if isChangeFlag is undefined
    !expenseLabel ||
    expenseYears.length === 0 ||
    //expenseCategories.length === 0 ||
    !expenseOperator
  ) {
    return res.status(400).json({ message: "All mandatory fields required" });
  }
  
  // Does the expense exist to update?
  const expenseToUpdate = await Expense.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!expenseToUpdate) {
    return res.status(400).json({ message: "Expense to update not found" });
  }
 
  expenseToUpdate.expenseLabel=expenseLabel
  expenseToUpdate.expensePhone=expensePhone
  expenseToUpdate.expenseAddress=expenseAddress
  expenseToUpdate.expenseNotes=expenseNotes
  expenseToUpdate.expenseIsActive=expenseIsActive
  expenseToUpdate.expenseYears=expenseYears
  //expenseToUpdate.expenseCategories=expenseCategories
  expenseToUpdate.expenseOperator=expenseOperator


 
    //console.log(expenseToUpdate,'expenseToUpdate')
    const updatedExpense = await expenseToUpdate.save(); //save old expense
    if (!updatedExpense) {
      return res.status(400).json({ message: "invalid expense data received" });
    }
      return res.status(201).json({
        message: `Expense: ${updatedExpense.expenseLabel} updated `,
      })

 

});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteExpense = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Expense ID Required" });
  }

  // Does the user exist to delete?
  const expense = await Expense.findById(id).exec();

  if (!expense) {
    return res.status(400).json({ message: "Expense to delete not found" });
  }

  // Delete the expense
  const result = await expense.deleteOne();

  const reply = `Expense  ${expense.expenseLabel}, with ID ${expense._id}, deleted `;

  return res.json(reply);
});

module.exports = {
  getAllExpenses,
  createNewExpense,
  updateExpense,
  deleteExpense,
};
