const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const expenseItemsSchema = new mongoose.Schema(
  {
    expenseCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
    },
    expenseCategoryItems: [{
      type: String,
      index: true,
      required: true,
      set: capitalizeFirstLetter,
    }],
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    //id is already assigned automatically by mongo

    expenseYear: {
      type: String,
      index: true,
      required: true,
    },
    expenseMonth: {
      type: String,
      index: true,
      required: true,
    },
    expenseAmount: {
      type: String,
      required: true,
    },
    expenseNote: {
      type: String,
      set: capitalizeFirstLetter,
    },
	expenseCategory: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "ExpenseCategory",
		required: true,
	  },
    expenseItems: [{
		type: String,
		index: true,
		required: true,
		set: capitalizeFirstLetter,
	  }],

    expensePayee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payee",
      required: true,
    },
    expenseService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    expensePaymentDate: {
      type: Date,
    },
  
    expenseMethod: {
      type: String,
      set: capitalizeFirstLetter,
    },

    expenseOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expenseCreator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);
module.exports = mongoose.model("Expense", expenseSchema, "expenses");
