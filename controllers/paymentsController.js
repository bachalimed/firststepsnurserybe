// const User = require('../models/User')
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
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
    // Find a single payment by its ID
    const payments = await Payment.find()
  .populate({
    path: 'paymentStudent',
    select: 'student_id studentName' // Selects only the fields you want from the student
  })
  .populate({
    path: 'paymentInvoices', // This will populate the paymentInvoices array
    select: '_id invoiceYear invoiceMonth invoiceDueDate invoiceIsFullyPaid invoiceAuthorisedAmount invoiceDiscountAmount invoiceAmount' // Include everything from Invoice (_id will be automatically included)
  })
  .lean();


    if (!payments) {
      return res.status(400).json({ message: "Payment not found" });
    }

    // Return the payment inside an array
    return res.json(payments); //we need it inside  an array to avoid response data error
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
  //console.log(req?.body);
  const {
    paymentYear,
    paymentStudent,
    paymentAmount,
    paymentInvoices,
    paymentNote,
    paymentType,
    paymentReference,
    paymentDate,
    paymentOperator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !paymentYear ||
    !paymentStudent ||
    !paymentAmount ||
    !paymentInvoices ||
    !paymentType ||
    !paymentDate ||
    !paymentOperator
  ) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

  // Check for duplicate payment or invoices paid previously
  const duplicate = await Payment.findOne({
    paymentYear,
    paymentStudent,
    paymentInvoices: { $in: paymentInvoices },
  });

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate payment or some invoices already paid for  ${duplicate.paymentInvoices} on  ${duplicate.paymentDate}}`,
    });
  }

  const paymentObject = {
    paymentYear: paymentYear,
    paymentStudent: paymentStudent,
    paymentAmount: paymentAmount,
    paymentInvoices: paymentInvoices,
    paymentNote: paymentNote,
    paymentType: paymentType,
    paymentReference: paymentReference,
    paymentDate: paymentDate,
    paymentOperator: paymentOperator,
    paymentCreator: paymentOperator,
    paymentRecordDate: new Date(),
  }; //construct new payment to be stored

  // Create and store new payment
  const payment = await Payment.create(paymentObject);
  if (!payment) {
    return res.status(400).json({ message: "Invalid payment data received No payment saved" });
  }
  if (payment) {
    console.log(payment,'payment')
    // Update each Invoice in Payment.paymentInvoices with newPaymentId and set fully paid to true
    // Get the new payment ID
    const newPaymentId = payment._id;

    const invoiceIDs = payment.paymentInvoices;

    // Update each Invoice in paymentInvoices with newPaymentId
    await Invoice.updateMany(
      { _id: { $in: invoiceIDs } }, // Filter invoices by IDs in the invoiceIDs array
      { 
        $set: { 
          invoicePayment: newPaymentId, 
          invoiceIsFullyPaid: true 
        } 
      }
    );

    // If created and students updated
    return res.status(201).json({
      message: `New payment  ${payment._id} of  ${payment.paymentAmount} for ${payment.paymentInvoices} created and ${payment.paymentInvoices.length} Invoices updated`,
    });
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
    return res.status(400).json({ message: "Payment to delete not found" });
  }
  // Remove the payment from students' `studentPayment` field
  await Invoice.updateMany(
    { invoicePayment: id }, // Condition: Find invoices where invoicePayment equals the provided id
    {
      $unset: { studentPayment: "" }, // Unset the studentPayment field
      $set: { 
        invoicePayment: null,         // Set invoicePayment to an empty value (you could use null if preferred)
        invoiceIsFullyPaid: false   // Set invoiceIsFullyPaid to false
      }
    }
  );
  

  // Delete the payment
  const result = await payment.deleteOne();

  const reply = `Payment of ${payment.paymentAmount}, with ID ${payment._id}, deleted and invoices updated`;

  return res.json(reply);
});

module.exports = {
  getAllPayments,
  createNewPayment,
  updatePayment,
  deletePayment,
};
