// const User = require('../models/User')
const Invoice = require("../models/Invoice");
const Enrolment = require("../models/Enrolment");
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

//helper function to provide sue date for invoices
const calculateDueDate = (enrolmentMonth, enrolmentYear) => {
  // Define the mapping for month to part of the academic year
  const firstPartMonths = ["September", "October", "November", "December"];
  const secondPartMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
  ];

  // Split the academic year into two parts (e.g., "2024/2025" -> "2024" and "2025")
  const [firstPartYear, secondPartYear] = enrolmentYear.split("/");

  // Determine the correct year to use based on the enrolmentMonth
  const yearToUse = firstPartMonths.includes(enrolmentMonth)
    ? firstPartYear // Use the first part of the year for Sep - Dec
    : secondPartYear; // Use the second part of the year for Jan - Aug

  // Create the due date as "YYYY-MM-01"
  const monthNumber = new Date(`${enrolmentMonth} 1, 2000`).getMonth() + 1; // Convert month to number (1-12)
  const formattedMonth = monthNumber < 10 ? `0${monthNumber}` : monthNumber; // Ensure month is two digits

  return `${yearToUse}-${formattedMonth}-01`;
};
// @desc Get all invoice
// @route GET 'desk/invoice
// @access Private // later we will establish authorisations
const getAllInvoices = asyncHandler(async (req, res) => {
  // console.log('helloooooooo')
  const { id, selectedYear, selectedMonth } = req.query;
  // Check if an ID is passed as a query parameter
  if (id) {
    // Find a single  invoice by its ID
    const invoice = await Invoice.findOne({ _id: id }).lean();

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Find enrolments with `enrolmentInvoice` matching the current invoice's `_id`
    const enrolments = await Enrolment.find({
      enrolmentInvoice: invoice._id,
    })
      .select(
        "serviceFinalFee serviceType servicePeriod serviceAuthorisedFee enrolmentMonth enrolmentYear student"
      )
      .populate({
        path: "student",
        select: "studentName _id", // Populate the student to get studentName and _id
      })
      .lean();

    // Attach the found enrolments to the invoice object
    const enrichedInvoice = {
      ...invoice,
      enrolments,
    };

    // Return the enriched invoice
    return res.json(enrichedInvoice);
  }

  if (selectedYear !== "1000" && selectedMonth) {
    // retrieve invoices with specified criteria and populated enrolments/students

    try {
      // Query invoices by year and month
      const invoices = await Invoice.find({
        invoiceYear: selectedYear,
        invoiceMonth: selectedMonth,
      }).lean();

      if (!invoices || invoices.length === 0) {
        return res.status(404).json({ message: "No invoices found" });
      }

      // Map invoices to enrich with enrolment and student data
      const enrichedInvoices = await Promise.all(
        invoices.map(async (invoice) => {
          // Find enrolments with `enrolmentInvoice` matching the current invoice's `_id`
          const enrolments = await Enrolment.find({
            enrolmentInvoice: invoice._id,
          })
            .select(
              "serviceFinalFee serviceType servicePeriod serviceAuthorisedFee enrolmentMonth enrolmentYear student"
            )
            .populate({
              path: "student",
              select: "studentName _id", // Populate the student to get studentName and _id
            })
            .lean();

          // Attach the found enrolments to the invoice object
          return {
            ...invoice,
            enrolments,
          };
        })
      );

      // Return the enriched invoices
      return res.json(enrichedInvoices);
    } catch (error) {
      console.error("Error retrieving invoices:", error);
      return res.status(500).json({ message: "Error retrieving invoices" });
    }
  }
  if (selectedYear === "1000") {
    // If no ID is provided, fetch all  invoices
    const invoices = await Invoice.find().lean();

    if (!invoices.length) {
      return res.status(404).json({ message: "No  invoices found" });
    }

    res.json(invoices);
  }
});

// // @desc getInvoiceByUSerId
// // @route GET 'desk/invoice/myInvoice with userID passed in the body of the query
// // @access Private // later we will establish authorisations
// const getInvoiceByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const invoice = await Invoice.find().lean()//this will not return the extra data(lean)

//     // If no students
//     if (!invoice?.length) {
//         return res.status(400).json({ message: 'No invoices found from invoice controller with love' })
//     }
//     res.json(invoice)
// })

//----------------------------------------------------------------------------------
// @desc Create new invoice
// @route POST 'desk/invoice
// @access Private
const createNewInvoice = asyncHandler(async (req, res) => {
  const { formData, operator } = req?.body; //this will come from front end we put all the fields o fthe collection here
  console.log(req?.body);
  //Confirm data is present in the request with all required fields

  if (!formData || formData.length < 1) {
    return res.status(400).json({ message: "no proper data received" }); //400 : bad request
  }
  // restructure the data
  try {
    // Array to store the IDs of successfully saved invoices
    const savedInvoiceIds = [];

    // Iterate through the formData
    for (const element of formData) {
      // Construct the invoice object
      const invoiceObj = {
        invoiceYear: element?.enrolmentYear,
        invoiceMonth: element?.enrolmentMonth,
        invoiceEnrolment: element?.id,
        invoiceDueDate: calculateDueDate(
          element?.enrolmentMonth,
          element?.enrolmentYear
        ),
        invoiceIssueDate: new Date().toISOString(),
        invoiceIsFullyPaid: false,
        invoiceAmount: element?.serviceFinalFee,
        invoiceAuthorisedAmount: element?.serviceAuthorisedFee,
        invoiceDiscountAmount: element?.invoiceDiscountAmount || 0, // Default to 0 if missing
        invoiceCreator: operator,
        invoiceOperator: operator,
      };

      // Validation of mandatory fields
      const {
        invoiceYear,
        invoiceMonth,
        invoiceEnrolment,
        invoiceDueDate,
        invoiceIssueDate,
        invoiceAmount,
        invoiceAuthorisedAmount,
        invoiceDiscountAmount,
        invoiceCreator,
      } = invoiceObj;

      if (
        !invoiceYear ||
        !invoiceMonth ||
        !invoiceEnrolment ||
        !invoiceDueDate ||
        !invoiceIssueDate ||
        invoiceAmount == null || // Allow 0 as a valid amount
        invoiceAuthorisedAmount == null || // Allow 0 as a valid authorised amount
        invoiceDiscountAmount == null || // Allow 0 as a valid discount
        !invoiceCreator
      ) {
        return res
          .status(400)
          .json({ message: "All mandatory data is required" });
      }
      if (element.enrolmentInvoice) {
        return res
          .status(400)
          .json({ message: `enrolment   ${element?.id} already invoiced` });
      }
      const duplicate = await Invoice.findOne({
        invoiceEnrolment: element?.id,
      }).lean();
      if (duplicate) {
        return res.status(400).json({
          message: `duplicate invoice for the enrolment ${element?.id} `,
        });
      }
      // Attempt to save the invoice
      const savedInvoice = await Invoice.create(invoiceObj);

      // If the invoice is successfully created, save the ID
      if (savedInvoice) {
        savedInvoiceIds.push(savedInvoice._id);

        // Update the enrolment's enrolmentInvoice attribute
        await Enrolment.findByIdAndUpdate(element.id, {
          enrolmentInvoice: savedInvoice._id,
        });
      } else {
        // Return an error if any invoice creation fails
        return res
          .status(400)
          .json({ message: "Invalid invoice data received" });
      }
    }

    // Send a single response after processing all invoices successfully
    res.status(201).json({
      message: "Invoices created successfully.",
      savedInvoiceIds: savedInvoiceIds,
    });
  } catch (error) {
    // Handle any unexpected errors
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// @desc Update a invoice
// @route PATCH 'desk/invoice
// @access Private
const updateInvoice = asyncHandler(async (req, res) => {
  const {
    id,
    invoiceYear,
    invoiceMonth,
    invoiceEnrolment,
    invoiceDueDate,
    invoiceIssueDate,
    invoiceIsFullyPaid,
    invoiceAmount,
    invoiceAuthorisedAmount,
    invoiceDiscountAmount,
    invoiceDiscountType,
    invoiceDiscountNote,
    invoiceOperator,
  } = req?.body;

  // Confirm data
  if (
    !id ||
    !invoiceYear ||
    !invoiceMonth ||
    !invoiceEnrolment ||
    !invoiceDueDate ||
    !invoiceIssueDate ||
    !invoiceAmount ||
    !invoiceAuthorisedAmount ||
    !invoiceOperator
  ) {
    return res.status(400).json({ message: "All mandatory fields required" });
  }

  // Does the invoice exist to update?
  const invoice = await Invoice.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!invoice ) {
    return res.status(400).json({ message: "Invoice not found" });
  }

    (invoice.invoiceDueDate = invoiceDueDate),
    (invoice.invoiceIsFullyPaid = invoiceIsFullyPaid),
    (invoice.invoiceAmount = invoiceAmount),
    (invoice.invoiceAuthorisedAmount = invoiceAuthorisedAmount),
    (invoice.invoiceDiscountAmount = invoiceDiscountAmount),
    (invoice.invoiceDiscountType = invoiceDiscountType),
    (invoice.invoiceDiscountNote = invoiceDiscountNote),
    (invoice.invoiceOperator = invoiceOperator);
  const updatedInvoice = await invoice.save(); //save method received when we did not include lean

  res.json({ message: `invoice due on: ${updatedInvoice.invoiceDueDate}, for  ${updatedInvoice.invoiceAmount} updated` });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Invoice ID Required" });
  }

  // Does the user exist to delete?
  const invoice = await Invoice.findById(id).exec();

  if (!invoice) {
    return res.status(400).json({ message: "Invoice not found" });
  }

  const result = await invoice.deleteOne();
 // Remove the enrolmentInvoice from the associated enrolment
 const updatedEnrolment = await Enrolment.findByIdAndUpdate(
  invoice.invoiceEnrolment,
  { $unset: { enrolmentInvoice: "" } }, // Remove enrolmentInvoice field
  { new: true }
);

if (!updatedEnrolment) {
  return res.status(400).json({ message: "Enrolment not found" });
}

 // Response message
 const reply = `Invoice  with ID ${invoice._id}, deleted and associated enrolment ${invoiceEnrolment._id}`;

 // Send the response
 res.json(reply);
});

module.exports = {
  getAllInvoices,
  createNewInvoice,
  updateInvoice,
  deleteInvoice,
};
