const Payee = require("../models/Payee");

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all payee
// @route GET 'desk/payee
// @access Private // later we will establish authorisations
const getAllPayees = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;

  if (selectedYear !== "1000") {
    // Find a single payee by its ID
    const payees = await Payee.find().lean();

    if (!payees) {
      return res.status(400).json({ message: "Payees not found" });
    }

    // Return the payee inside an array
    return res.json(payees); //we need it inside  an array to avoid response data error
  }

  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

    // Find a single payee by its ID
    const payee = await Payee.findOne({ _id: id })
      .populate("students", "-operator -studentDob -studentGardien -updatedAt")
      .lean();

    if (!payee) {
      return res.status(400).json({ message: "Payee not found" });
    }

    // Return the payee inside an array
    return res.json([payee]); //we need it inside  an array to avoid response data error
  }
  // If no ID is provided, fetch all payees
});

//----------------------------------------------------------------------------------
// @desc Create new payee
// @route POST 'desk/payee
// @access Private
const createNewPayee = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    payeeLabel,
    payeePhone,
    payeeAddress,
    payeeNotes,
    payeeIsActive,
    payeeYears,
    payeeCategories,
    payeeOperator,
    payeeCreator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !payeeLabel ||
    !payeeIsActive ||
    !payeeYears ||
    !payeeCategories ||
    !payeeOperator ||
    !payeeCreator
  ) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

  // Check for duplicate payee or invoices paid previously
  const duplicate = await Payee.findOne({
    payeeYears,
    payeeLabel,
    payeeCategories,
  });

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate payee   ${duplicate.payeeLabel}}`,
    });
  }

  const payeeObject = {
    payeeLabel: payeeLabel,
    payeePhone: payeePhone,
    payeeAddress: payeeAddress,
    payeeNotes: payeeNotes,
    payeeIsActive: payeeIsActive,
    payeeYears: payeeYears,
    payeeCategories: payeeCategories,
    payeeOperator: payeeOperator,
    payeeCreator: payeeCreator,
  }; //construct new payee to be stored

  // Create and store new payee
  const payee = await Payee.create(payeeObject);
  if (!payee) {
    return res
      .status(400)
      .json({ message: "Invalid payee data received No payee saved" });
  }
  // If created and students updated
  return res.status(201).json({
    message: `New payee  ${payee.payeeLabel} `,
  });
});

// @desc Update a payee
// @route PATCH 'desk/payee
// @access Private
const updatePayee = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that payee in any other, the latter will have an ending date
  const {
    id,
    isChangeFlag,
    payeeLabel,
    payeeYear,
    students,
    payeeColor,
    payeeType,
    payeeFrom,
    // payeeTo,
    payeeAnimator,
    payeeLocation,
    operator,
  } = req?.body;

  // Confirm data
  if (
    !payeeLabel ||
    isChangeFlag === undefined || // Checks if isChangeFlag is undefined
    !payeeYear ||
    !students ||
    students.length === 0 ||
    !payeeColor ||
    !payeeType ||
    //!payeeTo ||
    !payeeFrom ||
    !payeeAnimator ||
    !payeeLocation ||
    !operator
  ) {
    return res.status(400).json({ message: "All mandatory fields required" });
  }
  //check for duplcate
  // Check for duplicate, no need because we can have same attributes but different students
  //  const duplicatePayee = await Payee.findOne({ payeeLabel,}).lean().exec();

  //  // Allow updates to the original service
  //  if (duplicatePayee?._id.toString() !== id) {
  //    return res.status(409).json({ message: "Duplicate payee found with the same Label" });
  //  }

  // Does the payee exist to update?
  const payeeToUpdate = await Payee.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!payeeToUpdate) {
    return res.status(400).json({ message: "Payee to update not found" });
  }
  if (isChangeFlag) {
    //if there was a change we set payeeTo and create a new payee with new data
    payeeToUpdate.payeeTo = payeeFrom; //the starting dat aof new payee is ending date of old payee

    //console.log(payeeToUpdate,'payeeToUpdate')
    const updatedPayee = await payeeToUpdate.save(); //save old payee
    const newPayeeObject = {
      payeeLabel,
      payeeYear,
      students,
      payeeColor,
      payeeType,
      payeeFrom,
      //payeeTo,
      payeeAnimator,
      payeeLocation,
      operator,
      creator: operator,
    }; //construct new payee to be stored

    // Create and store new payee
    const newPayee = await Payee.create(newPayeeObject);

    if (newPayee) {
      // Update students with new payee ID
      await Student.updateMany(
        { _id: { $in: students } },
        { $set: { studentPayee: newPayee._id } }
      );

      res.status(201).json({
        message: `Payee: ${updatedPayee.payeeLabel} updated and ${newPayee.payeeLabel} created`,
      });
    } else {
      return res.status(400).json({ message: "Invalid payee data received" });
    }
  }
  if (isChangeFlag !== undefined && !isChangeFlag) {
    //no students were changed so we only update the curretn payee
    //if there was a change we set payeeTo and create a new payee with new data
    // payeeToUpdate.payeeTo = payeeTo //it will only allow updating properties that are already existant in the model
    payeeToUpdate.payeeLabel = payeeLabel;
    payeeToUpdate.payeeYear = payeeYear;
    //payeeToUpdate.students, //because no student swere added or removed
    payeeToUpdate.payeeColor = payeeColor;
    payeeToUpdate.payeeType = payeeType;
    payeeToUpdate.payeeFrom = payeeFrom;
    //payeeTo,
    payeeToUpdate.payeeAnimator = payeeAnimator;
    payeeToUpdate.payeeLocation = payeeLocation;
    payeeToUpdate.operator = operator;

    // update payee
    const updatedPayee = await payeeToUpdate.save(); //save old payee

    if (updatedPayee) {
      // Update students with the updated payee's ID
      await Student.updateMany(
        { _id: { $in: students } },
        { $set: { studentPayee: updatedPayee._id } }
      );

      res.status(201).json({
        message: `Payee ${updatedPayee.payeeLabel} updated`,
      });
    } else {
      return res.status(400).json({ message: "Invalid payee data received" });
    }
  }
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deletePayee = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Payee ID Required" });
  }

  // Does the user exist to delete?
  const payee = await Payee.findById(id).exec();

  if (!payee) {
    return res.status(400).json({ message: "Payee to delete not found" });
  }

  // Delete the payee
  const result = await payee.deleteOne();

  const reply = `Payee  ${payee.payeeLabel}, with ID ${payee._id}, deleted `;

  return res.json(reply);
});

module.exports = {
  getAllPayees,
  createNewPayee,
  updatePayee,
  deletePayee,
};
