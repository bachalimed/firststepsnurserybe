// const User = require('../models/User')
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const AttendedSchool = require("../models/AttendedSchool");

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all payment
// @route GET 'desk/payment
// @access Private // later we will establish authorisations
const getAllPayments = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;
  
 

 
    if (selectedYear !== "1000") {
      console.log("hell")

       

        
      
    } 
  
  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

    // Find a single payment by its ID
    const payment = await Payment.findOne({ _id: id })
      .populate("students", "-operator -studentDob -studentGardien -updatedAt")
      .lean();

    if (!payment) {
      return res.status(400).json({ message: "Payment not found" });
    }

    // Return the payment inside an array
    return res.json([payment]); //we need it inside  an array to avoid response data error
  }
  // If no ID is provided, fetch all payments
});

//----------------------------------------------------------------------------------
// @desc Create new payment
// @route POST 'desk/payment
// @access Private
const createNewPayment = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  console.log(req?.body);
  const {
    paymentLabel,
    paymentYear,
    students,
    paymentColor,
    paymentType,
    paymentFrom,
    paymentTo,
    paymentAnimator,
    paymentLocation,
    operator,
    creator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !paymentLabel ||
    !paymentYear ||
    !students ||
    students.length === 0 ||
    !paymentColor ||
    !paymentType ||
    !paymentFrom ||
    !paymentAnimator ||
    !paymentLocation ||
    !operator ||
    !creator
  ) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await Payment.findOne({
    paymentYear,
    paymentType,
    paymentLabel,
  })
    .lean()
    .exec(); //because we re receiving only one response from mongoose

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate payment: ${duplicate.paymentLabel}  ${duplicate.paymentType} , found for ${duplicate.paymentYear}`,
    });
  }

  const paymentObject = {
    paymentLabel,
    paymentYear,
    students,
    paymentColor,
    paymentType,
    paymentFrom,
    paymentTo,
    paymentAnimator,
    paymentLocation,
    operator,
    creator,
  }; //construct new payment to be stored

  // Create and store new payment
  const payment = await Payment.create(paymentObject);

  if (payment) {
    // Get the new payment ID
    const newPaymentId = payment._id;

    // Update each student in payment.students with studentPayment = newPaymentId
    await Student.updateMany(
      { _id: { $in: payment.students } }, // Filter: only students in payment.students array
      { $set: { studentPayment: newPaymentId } } // Update: set studentPayment to newPaymentId
    );

    // If created and students updated
    res.status(201).json({
      message: `New payment ${payment.paymentLabel}, ${payment.paymentType}, for ${payment.paymentYear} created and students updated`,
    });
  } else {
    res.status(400).json({ message: "Invalid payment data received" });
  }
});

// @desc Update a payment
// @route PATCH 'desk/payment
// @access Private
const updatePayment = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that payment in any other, the latter will have an ending date
  const {
    id,
    isChangeFlag,
    paymentLabel,
    paymentYear,
    students,
    paymentColor,
    paymentType,
    paymentFrom,
    // paymentTo,
    paymentAnimator,
    paymentLocation,
    operator,
  } = req?.body;

  // Confirm data
  if (
    !paymentLabel ||
    isChangeFlag === undefined || // Checks if isChangeFlag is undefined
    !paymentYear ||
    !students ||
    students.length === 0 ||
    !paymentColor ||
    !paymentType ||
    //!paymentTo ||
    !paymentFrom ||
    !paymentAnimator ||
    !paymentLocation ||
    !operator
  ) {
    return res.status(400).json({ message: "All mandatory fields required" });
  }
  //check for duplcate
  // Check for duplicate, no need because we can have same attributes but different students
  //  const duplicatePayment = await Payment.findOne({ paymentLabel,}).lean().exec();

  //  // Allow updates to the original service
  //  if (duplicatePayment?._id.toString() !== id) {
  //    return res.status(409).json({ message: "Duplicate payment found with the same Label" });
  //  }

  // Does the payment exist to update?
  const paymentToUpdate = await Payment.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!paymentToUpdate) {
    return res.status(400).json({ message: "Payment to update not found" });
  }
  if (isChangeFlag) {
    //if there was a change we set paymentTo and create a new payment with new data
    paymentToUpdate.paymentTo = paymentFrom; //the starting dat aof new payment is ending date of old payment

    //console.log(paymentToUpdate,'paymentToUpdate')
    const updatedPayment = await paymentToUpdate.save(); //save old payment
    const newPaymentObject = {
      paymentLabel,
      paymentYear,
      students,
      paymentColor,
      paymentType,
      paymentFrom,
      //paymentTo,
      paymentAnimator,
      paymentLocation,
      operator,
      creator: operator,
    }; //construct new payment to be stored

    // Create and store new payment
    const newPayment = await Payment.create(newPaymentObject);

    if (newPayment) {
      // Update students with new payment ID
      await Student.updateMany(
        { _id: { $in: students } },
        { $set: { studentPayment: newPayment._id } }
      );

      res.status(201).json({
        message: `Payment: ${updatedPayment.paymentLabel} updated and ${newPayment.paymentLabel} created`,
      });
    } else {
      return res.status(400).json({ message: "Invalid payment data received" });
    }
  }
  if (isChangeFlag !== undefined && !isChangeFlag) {
    //no students were changed so we only update the curretn payment
    //if there was a change we set paymentTo and create a new payment with new data
    // paymentToUpdate.paymentTo = paymentTo //it will only allow updating properties that are already existant in the model
    paymentToUpdate.paymentLabel = paymentLabel;
    paymentToUpdate.paymentYear = paymentYear;
    //paymentToUpdate.students, //because no student swere added or removed
    paymentToUpdate.paymentColor = paymentColor;
    paymentToUpdate.paymentType = paymentType;
    paymentToUpdate.paymentFrom = paymentFrom;
    //paymentTo,
    paymentToUpdate.paymentAnimator = paymentAnimator;
    paymentToUpdate.paymentLocation = paymentLocation;
    paymentToUpdate.operator = operator;

    // update payment
    const updatedPayment = await paymentToUpdate.save(); //save old payment

    if (updatedPayment) {
      // Update students with the updated payment's ID
      await Student.updateMany(
        { _id: { $in: students } },
        { $set: { studentPayment: updatedPayment._id } }
      );

      res.status(201).json({
        message: `Payment ${updatedPayment.paymentLabel} updated`,
      });
    } else {
      return res.status(400).json({ message: "Invalid payment data received" });
    }
  }
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deletePayment = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Payment ID Required" });
  }

  // Does the user exist to delete?
  const payment = await Payment.findById(id).exec();

  if (!payment) {
    return res.status(400).json({ message: "Payment not found" });
  }
  // Remove the payment from students' `studentPayment` field
  await Student.updateMany(
    { studentPayment: id },
    { $unset: { studentPayment: "" } }
  );

  // Delete the payment
  const result = await payment.deleteOne();

  const reply = `Payment ${payment.paymentLabel}, with ID ${payment._id}, deleted`;

  res.json(reply);
});

module.exports = {
  getAllPayments,
  createNewPayment,
  updatePayment,
  deletePayment,
};
