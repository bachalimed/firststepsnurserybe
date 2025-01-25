// const User = require('../models/User')
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Family = require("../models/Family");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const User = require("../models/User");

const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

const getPaymentsStats = async (selectedYear) => {
  try {
    // const result = await Payment.aggregate([
    //   {
    //     $match: {
    //       paymentYear: selectedYear, // Filter payments by the selected year
    //     },
    //   },
    //   {
    //     $addFields: {
    //       paymentAmountAsNumber: { $toDouble: "$paymentAmount" }, // Convert paymentAmount to number
    //       paymentMonth: {
    //         $month: "$paymentDate", // Extract the month from paymentDate
    //       },
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$paymentMonth", // Group by extracted month
    //       monthlyTotal: { $sum: "$paymentAmountAsNumber" }, // Sum payment amounts per month
    //     },
    //   },
    //   {
    //     $sort: { _id: 1 }, // Sort by month number (ascending)
    //   },
    // ]);
    // we needed to use the invoice to get ehmonth, so that the payment is linked to themonth and not when it was paid, the invoiceamount is used instead of payment becasue one payment can provide many invoices
    const result = await Payment.aggregate([
      {
        $match: {
          paymentYear: selectedYear, // Filter payments by the selected year
        },
      },
      {
        $unwind: "$paymentInvoices", // Deconstruct the paymentInvoices array
      },
      {
        $lookup: {
          from: "invoices",
          localField: "paymentInvoices",
          foreignField: "_id",
          as: "invoiceDetails", // Join invoice details
        },
      },
      {
        $unwind: "$invoiceDetails", // Deconstruct the joined invoiceDetails array
      },
      {
        $addFields: {
          paymentMonth: "$invoiceDetails.invoiceMonth", // Get invoiceMonth from invoiceDetails
          paymentAmountAsNumber: { $toDouble: "$invoiceDetails.invoiceAmount" }, // Convert invoiceAmount to number
        },
      },
      {
        $group: {
          _id: "$paymentMonth", // Group by invoiceMonth
          monthlyTotal: { $sum: "$paymentAmountAsNumber" }, // Sum the invoice amounts for each month
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month number (ascending)
      },
    ]);

    //console.log(result,'result');

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
      paymentMonth: item._id, // Convert month number to name
      paymentsMonthlyTotal: item.monthlyTotal,
    }));
    //console.log(monthlyPayments,'monthlyPayments')
    return {
      totalPaymentsAmount: totalAmount,
      monthlyPayments,
    };
  } catch (error) {
    console.error("Error computing payments stats:", error);
    throw error;
  }
};
///
const getInvoicesWithEnrolments = async (invoiceIDs) => {
  try {
    // Validate invoiceIDs input
    if (!Array.isArray(invoiceIDs) || invoiceIDs.length === 0) {
      throw new Error("Invalid or missing invoice IDs");
    }

    // Retrieve invoices and populate enrolments
    const invoices = await Invoice.find({ _id: { $in: invoiceIDs } })
      .select("_id invoiceMonth invoiceAmount") // Select required fields from invoices
      .populate({
        path: "invoiceEnrolment", // Populate enrolments
        select: "_id serviceType servicePeriod", // Select required fields from enrolments
      })
      .lean();
    // console.log(invoices, "invoicesin retrieval");
    // Structure the invoices with their corresponding enrolments
    // const structuredInvoices = invoices.map((invoice) => ({
    //   _id: invoice._id,
    //   invoiceMonth: invoice.invoiceMonth,
    //   invoiceAmount: invoice.invoiceAmount,
    //   enrolments: Array.isArray(invoice.invoiceEnrolment)
    //     ? invoice.invoiceEnrolment.map((enrolment) => ({
    //         _id: enrolment._id,
    //         serviceType: enrolment.serviceType,
    //         servicePeriod: enrolment.servicePeriod,
    //       }))
    //     : [],
    // }));
    //console.log(structuredInvoices,'structuredInvoices')
    return invoices;
  } catch (error) {
    console.error("Error retrieving invoices with enrolments:", error);
    throw new Error("Failed to retrieve invoices with enrolments");
  }
};

// @desc Get all payment
// @route GET 'desk/payment
// @access Private // later we will establish authorisations
const getAllPayments = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear, selectedMonth } = req.query;
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
      const { totalPaymentsAmount, monthlyPayments } = await getPaymentsStats(
        selectedYear
      );

      return res.status(200).json({ totalPaymentsAmount, monthlyPayments });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to calculate total payments" });
    }
  }

  if (selectedYear !== "1000") {
    // Find a single payment by its ID
    const payments = await Payment.find()
      .populate({
        path: "paymentStudent",
        select: "student_id studentName studentIsActive", // Selects only the fields you want from the student
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
    const studentIds = payments
      .map((payment) => payment.paymentStudent?._id)
      .filter(Boolean);

    // Find families where children.child matches any of the student IDs
    const families = await Family.find({
      "children.child": { $in: studentIds },
    })
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
    families.forEach((family) => {
      family.children.forEach((child) => {
        familyMap[child.child] = {
          father: family.father?.userFullName || "Unknown Father",
          mother: family.mother?.userFullName || "Unknown Mother",
          id: family._id || "Unknown family Id",
        };
      });
    });

    // Add family info to each payment
    payments.forEach((payment) => {
      const studentId = payment.paymentStudent?._id;
      payment.familyInfo = familyMap[studentId] || {
        father: "No Family Found",
        mother: "No Family Found",
        id: "Unknown family Id",
      };
    });
    // Sort the payments by student's name and payment date
    const sortedPayments = payments.sort((a, b) => {
      // Concatenate the student's full name for both payments
      const nameA = `${a.paymentStudent?.studentName?.firstName || ""} ${
        a.paymentStudent?.studentName?.middleName || ""
      } ${a.paymentStudent?.studentName?.lastName || ""}`
        .trim()
        .toLowerCase();
      const nameB = `${b.paymentStudent?.studentName?.firstName || ""} ${
        b.paymentStudent?.studentName?.middleName || ""
      } ${b.paymentStudent?.studentName?.lastName || ""}`
        .trim()
        .toLowerCase();

      // Compare names first
      const nameComparison = nameA.localeCompare(nameB);

      if (nameComparison !== 0) {
        return nameComparison; // If names are different, return the comparison result
      }

      // If names are the same, compare payment dates
      const paymentDateA = new Date(a.paymentDate);
      const paymentDateB = new Date(b.paymentDate);

      return paymentDateA - paymentDateB; // Ascending order by payment date
    });

    // Return the payment inside an array
    return res.json(sortedPayments); //we need it inside  an array to avoid response data error
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
    //console.log(payment, "payment");
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
    //we now create a notification and save it

    //retrive the parents ids

    const family = await Family.findOne(
      {
        children: {
          $elemMatch: { child: paymentStudent }, // Match a child in the children array
        },
      },
      {
        father: 1, // Include father in the result
        mother: 1, // Include mother in the result
        "children.$": 1, // Use positional operator to retrieve only the matching child
      }
    )
      .populate({
        path: "children.child", // Path to populate
        select: "studentName", // Include only the studentName field
      })
      .lean();

    if (family) {
      const { father, mother, children } = family;
      const student = children[0]?.child; // Populated child document

      //retrive the services and amounts
      const invoices = await Invoice.find({ _id: { $in: invoiceIDs } })
        .select("_id invoiceMonth invoiceAmount") // Select required fields from invoices
        .populate({
          path: "invoiceEnrolment", // Populate enrolments
          select: "_id serviceType servicePeriod", // Select required fields from enrolments
        })
        .lean();
      //console.log(invoices, "invoices");
      const notificationContent = `A new payment of ${paymentAmount} TND was made for ${
        student?.studentName?.firstName
      } ${student?.studentName?.middleName || ""} ${
        student?.studentName?.lastName
      } as follows:\n${invoices
        .map(
          (invoice) =>
            `Service: ${invoice?.invoiceEnrolment?.serviceType} - ${invoice?.invoiceMonth} (${invoice?.invoiceEnrolment?.servicePeriod})
      Amount: ${invoice?.invoiceAmount} TND`
        )
        .join("\n")}`;

      const notificationExcerpt = `Payment of ${paymentAmount} TND for ${
        student?.studentName?.firstName
      } ${student?.studentName?.middleName || ""} ${
        student?.studentName?.lastName
      } on ${new Date().toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}`;
      // text notification example: Garderie First Steps:  payment total de [All] TND pour [ first name]. 110 (garde-sept), (30)repas-sept, (111)admission (max 145characters)
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
        notificationYear: paymentYear,
        notificationToParents: [father, mother], //the user id who will receive father and mother id
        notificationToUsers: targetUsers, //the user id who will receive father and mother id
        notificationType: "Payment",
        notificationPayment: newPaymentId,
        //notificationLeave,
        //notificationAdmission,
        notificationTitle: "New Payment",
        notificationContent: notificationContent,
        notificationExcerpt: notificationExcerpt,
        notificationDate: new Date(),
        notificationIsToBeSent: true,
        notificationIsRead: [],
      };
      const savedNotification = await Notification.create(newNotification);

      // If created and students updated
      return res.status(201).json({
        message: `Payment created and Invoice(s) updated successfully`,
      });
    }
  }
});

// @desc Update a payment
// @route PATCH 'desk/payment
// @access Private
const updatePayment = asyncHandler(async (req, res) => {
  ///no update of payments, delete payment and genertae anew one
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

  return res.json({ message: reply });
});

module.exports = {
  getAllPayments,
  createNewPayment,
  updatePayment,
  deletePayment,
};
