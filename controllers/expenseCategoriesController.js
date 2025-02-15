const ExpenseCategory = require("../models/ExpenseCategory");
const Service = require("../models/Service");

const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all expenseCategory
// @route GET 'desk/expenseCategory
// @access Private // later we will establish authorisations
const getAllExpenseCategories = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;
  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

    // Find a single expenseCategory by its ID
    const expenseCategory = await ExpenseCategory.findOne({ _id: id })
      
      // .populate({
      //   path: 'service', // Field to populate (assuming it's named 'service')
      //   select: 'serviceType', // Only retrieve the 'serviceType' field
      // })
      .lean();

    if (!expenseCategory) {
      return res.status(400).json({ message: "ExpenseCategory not found" });
    }

    // Return the expenseCategory inside an array
    return res.json([expenseCategory]); //we need it inside  an array to avoid response data error
  }
  if (selectedYear !== "1000") {
    // Find a single expenseCategory by its ID
    const expenseCategories = await ExpenseCategory.find()
  // .populate({
  //   path: 'expenseCategoryService', 
  //   select: 'serviceType', 
  // })
  .lean();

    if (!expenseCategories) {
      return res.status(400).json({ message: "ExpenseCategories not found" });
    }

    // Return the expenseCategory inside an array
    return res.json(expenseCategories); //we need it inside  an array to avoid response data error
  }

  
  // If no ID is provided, fetch all expenseCategories
});

//----------------------------------------------------------------------------------
// @desc Create new expenseCategory
// @route POST 'desk/expenseCategory
// @access Private
const createNewExpenseCategory = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    expenseCategoryLabel,
    expenseCategoryYears,
    expenseCategoryItems,
    //expenseCategoryService,
    expenseCategoryIsActive,
    expenseCategoryOperator,
    expenseCategoryCreator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !expenseCategoryLabel ||
    !expenseCategoryIsActive||
    //!expenseCategoryService||
    !expenseCategoryYears ||
    !expenseCategoryItems ||
    expenseCategoryYears?.length<1 ||
    expenseCategoryItems?.length<1 ||
    !expenseCategoryOperator ||
    !expenseCategoryCreator
  ) {
    return res
      .status(400)
      .json({ message: "Required data is missing" }); //400 : bad request
  }

  // Check for duplicate expenseCategory or invoices paid previously
  const duplicate = await ExpenseCategory.findOne({
    
    expenseCategoryLabel,
    //expenseCategoryCategories,
  });

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate expenseCategory   ${duplicate.expenseCategoryLabel}}`,
    });
  }
  const sortedExpenseCategoryItems = [...expenseCategoryItems].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  const expenseCategoryObject = {
    expenseCategoryLabel: expenseCategoryLabel,
    expenseCategoryYears: expenseCategoryYears,
    expenseCategoryItems: sortedExpenseCategoryItems,
    //expenseCategoryService: expenseCategoryService,
    expenseCategoryIsActive: expenseCategoryIsActive,
    expenseCategoryOperator: expenseCategoryOperator,
    expenseCategoryCreator: expenseCategoryCreator,
  }; //construct new expenseCategory to be stored

  // Create and store new expenseCategory
  const expenseCategory = await ExpenseCategory.create(expenseCategoryObject);
  if (!expenseCategory) {
    return res
      .status(400)
      .json({ message: "Invalid expenseCategory data received" });
  }
  // If created 
  return res.status(201).json({
    message: `Expense category  ${expenseCategory.expenseCategoryLabel} created Successfully `,
  });
});

// @desc Update a expenseCategory
// @route PATCH 'desk/expenseCategory
// @access Private
const updateExpenseCategory = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that expenseCategory in any other, the latter will have an ending date
  const {
    id,
    expenseCategoryLabel,
    expenseCategoryYears,
    expenseCategoryItems,
    //expenseCategoryService,
    expenseCategoryIsActive,
    expenseCategoryOperator,
  } = req?.body;

  // Confirm data
  if (
    !id ||
    !expenseCategoryLabel ||
    !expenseCategoryIsActive||
    !expenseCategoryYears ||
    //!expenseCategoryService ||
    !expenseCategoryItems ||
    expenseCategoryYears?.length<1 ||
    expenseCategoryItems?.length<1 ||
    !expenseCategoryOperator 
  ) {
    return res.status(400).json({ message: "Required data is missing" });
  }
  
  // Does the expenseCategory exist to update?
  const expenseCategoryToUpdate = await ExpenseCategory.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!expenseCategoryToUpdate) {
    return res.status(400).json({ message: "ExpenseCategory to update not found" });
  }
  const sortedExpenseCategoryItems = [...expenseCategoryItems].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  expenseCategoryToUpdate.expenseCategoryLabel=expenseCategoryLabel
  expenseCategoryToUpdate.expenseCategoryYears=expenseCategoryYears
  expenseCategoryToUpdate.expenseCategoryItems=sortedExpenseCategoryItems
 // expenseCategoryToUpdate.expenseCategoryService=expenseCategoryService
  expenseCategoryToUpdate.expenseCategoryIsActive=expenseCategoryIsActive
  expenseCategoryToUpdate.expenseCategoryOperator=expenseCategoryOperator
    const updatedExpenseCategory = await expenseCategoryToUpdate.save(); //save old expenseCategory
    if (!updatedExpenseCategory) {
      return res.status(400).json({ message: "invalid data received" });
    }
      return res.status(201).json({
        message: `Expense category updated successfully`,
      })

 

});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteExpenseCategory = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the user exist to delete?
  const expenseCategory = await ExpenseCategory.findById(id).exec();

  if (!expenseCategory) {
    return res.status(400).json({ message: "ExpenseCategory to delete not found" });
  }

  // Delete the expenseCategory
  const result = await expenseCategory.deleteOne();

  const reply = `Deleted ${result?.deletedCount} Expense category`;

  return res.json({message:reply});
});

module.exports = {
  getAllExpenseCategories,
  createNewExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
};
