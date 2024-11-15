const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const invoiceSchema = new mongoose.Schema(
  {
    invoiceYear: { type: String, index: true, required: true },
    invoiceMonth: {
      type: String,
      index: true,
      required: true,
      set: capitalizeFirstLetter,
    },
    invoiceEnrolment: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
      ref: "Enrolment",
    },
    // invoiceStudent: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   index: true,
    //   required: true,
    //   ref: "Student",
    // },
    invoiceDueDate: { type: Date, index: true, required: true },
    invoiceIssueDate: { type: Date, index: true, required: true },
    invoiceIsFullyPaid: { type: Boolean, index: true },
    invoiceAmount: { type: String, index: true, required: true },
    invoiceAuthorisedAmount: { type: String, index: true, required: true },
    invoiceDiscountAmount: { type: String, index: true },
    invoiceDiscountType: { type: String, index: true },
    invoiceCreator: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
      ref: "User",
    },
    invoiceOperator: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);
module.exports = mongoose.model("Invoice", invoiceSchema, "invoices"); //the thrid is the name that will be used in the mongo collection
