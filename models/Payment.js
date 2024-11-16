const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    paymentYear: {
      type: String,
      required: true,
    },

    paymentAmount: {
      type: String,
      required: true,
    },
    paymentInvoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        required: true,
      },
    ], // can pay once for many invoices
    paymentNote: {
      type: String,
    },
    paymentType: {
      type: String,
      required: true,
      enum: ["Cash", "Cheque", "Bank Transfer", "Online Payment"],
    },
    paymentTypeReference: {
      type: String,
    },
    paymentDate: {
      // when payment was made
      type: Date,
      required: true,
    },
    paymentRecordDate: {
      //when data was entered
      type: Date,
      default: Date.now,
    },

    paymentCreator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the Payment
      ref: "User",
    },
    paymentOperator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the Payment
      ref: "User",
    },
  },

  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);

// Index for faster queries on recurring Payments
PaymentSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("Payment", PaymentSchema, "Payments");
