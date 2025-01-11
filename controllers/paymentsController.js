// const User = require('../models/User')
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Family = require("../models/Family");

const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

const getPaymentsStats = async (selectedYear) => {
  try {
    const result = await Payment.aggregate([
      {
        $match: {
          paymentYear: selectedYear, // Filter payments by the selected year
        },
      },
      {
        $addFields: {
          paymentAmountAsNumber: { $toDouble: "$paymentAmount" }, // Convert paymentAmount to number
          paymentMonth: {
            $month: "$paymentDate", // Extract the month from paymentDate
          },
        },
      },
      {
        $group: {
          _id: "$paymentMonth", // Group by extracted month
          monthlyTotal: { $sum: "$paymentAmountAsNumber" }, // Sum payment amounts per month
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month number (ascending)
      },
    ]);

    // Convert month numbers to month names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Calculate the total amount and format results with month names
    const totalAmount = result.reduce(
      (sum, month) => sum + month.monthlyTotal,
      0
    );

    const monthlyPayments = result.map((item) => ({
      paymentMonth: monthNames[item._id - 1], // Convert month number to name
      paymentsMonthlyTotal: item.monthlyTotal,
    }));

    return {
      totalPaymentsAmount: totalAmount,
      monthlyPayments,
    };
  } catch (error) {
    console.error("Error computing payments stats:", error);
    throw error;
  }
};



// @desc Get all payment
// @route GET 'desk/payment
// @access Private // later we will establish authorisations
const getAllPayments = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear,selectedMonth  } = req.query;
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
  if (
    selectedYear !== "1000" &&
    criteria === "DashFinancesTotalPaymentsStats"
  ) {
    // Find a single payment by its ID
    try {
      const {totalPaymentsAmount,monthlyPayments} = await getPaymentsStats(selectedYear);
      
      return res.status(200).json({ totalPaymentsAmount, monthlyPayments});
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to calculate total payments" });
    }
  }

  if (selectedYear !== "1000" ) {
    // Find a single payment by its ID
    const payments = await Payment.find()
      .populate({
        path: "paymentStudent",
        select: "student_id studentName", // Selects only the fields you want from the student
      })
      .populate({
        path: "paymentInvoices", // Populate the paymentInvoices array
        select:
          "_id invoiceYear invoiceMonth invoiceDueDate invoiceIsFullyPaid invoiceAuthorisedAmount invoiceDiscountAmount invoiceAmount", // Include these fields in the Invoice
        populate: {
          path: "invoiceEnrolment", // Populate the invoiceEnrolment field within each Invoice
          select: "serviceType servicePeriod", // Include serviceType and servicePeriod from Enrolment
        },
      })
      .lean();

    if (!payments) {
      return res.status(400).json({ message: "No payments found" });
    }
 // we will add teh father and mother names tohte payments


// Retrieve all paymentStudent IDs to batch query families
const studentIds = payments.map(payment => payment.paymentStudent?._id).filter(Boolean);

// Find families where children.child matches any of the student IDs
const families = await Family.find({ "children.child": { $in: studentIds } })
  .populate({
    path: "father",
    select: "userFullName", // Retrieve only userFullName for father
  })
  .populate({
    path: "mother",
    select: "userFullName", // Retrieve only userFullName for mother
  })
  .lean(); // Converts Mongoose documents to plain JavaScript objects
  
// Map families by child ID for quick access
const familyMap = {};
families.forEach(family => {
  family.children.forEach(child => {
    familyMap[child.child] = {
      father: family.father?.userFullName || "Unknown Father",
      mother: family.mother?.userFullName || "Unknown Mother",
      id:family._id||"Unknown family Id"
    };
  });
});

// Add family info to each payment
payments.forEach(payment => {
  const studentId = payment.paymentStudent?._id;
  payment.familyInfo = familyMap[studentId] || {
    father: "No Family Found",
    mother: "No Family Found",
    id:"Unknown family Id"
  };
});

    // Return the payment inside an array
    return res.json(payments); //we need it inside  an array to avoid response data error
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
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
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
    return res.status(400).json({ message: "Invalid data received" });
  }
  if (payment) {
    console.log(payment, "payment");
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
          invoiceIsFullyPaid: true,
        },
      }
    );

    // If created and students updated
    return res.status(201).json({
      message: `Payment created and Invoices updated successfully`,
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
    return res.status(400).json({ message: "Required data is missing" });
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
        message: `Payment updated successfully`,
      });
    } else {
      return res.status(400).json({ message: "Invalid data received" });
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
        message: `Payment updated successfully`,
      });
    } else {
      return res.status(400).json({ message: "Invalid data received" });
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
    return res.status(400).json({ message: "Required data is missing" });
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
        invoicePayment: null, // Set invoicePayment to an empty value (you could use null if preferred)
        invoiceIsFullyPaid: false, // Set invoiceIsFullyPaid to false
      },
    }
  );

  // Delete the payment
  const result = await payment.deleteOne();

  const reply = `Deleted ${result?.deletedCount} payment and invoices updated successfully`;

  return res.json({message:reply});
});

module.exports = {
  getAllPayments,
  createNewPayment,
  updatePayment,
  deletePayment,
};
