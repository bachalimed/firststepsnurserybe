const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentYear: {
      type: String,
      required: true,
    },
    paymentStudent: {
      type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
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
      //enum: ["Cash", "Cheque", "Bank Transfer", "Online Payment"],
    },
    paymentReference: {
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
    // paymentIsNotified: {
     
    //   type: Boolean,
    //   default: false,
    // },

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



module.exports = mongoose.model("Payment", paymentSchema, "payments");
