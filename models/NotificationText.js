const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const notificationTextUsersSchema = new mongoose.Schema({}, { _id: false });

const NotificationTextSchema = new mongoose.Schema(
  {
    notificationTextType: {
      //Receipt, payment reminder, information
      type: String,
      set: capitalizeFirstLetter,
    },
    notificationTextPayment: {
      //related to payment
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    notificationTextIsToBeSent: { type: Boolean, index: true }, //if the system setitings sending option is avaialble or not will be recorded on the notificationText

    notificationTextLeave: {
      //related to Leave
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
    },
    notificationTextAdmission: {
      //related to admission
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
    },
    notificationTextExpense: {
      //related to admission
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
    },
    notificationTextTitle: {
      //the content of the notificationText
      type: String,
      required: true,
      set: capitalizeFirstLetter,
    },
    notificationTextContent: {
      //the content of the notificationText
      type: String,
      required: true,
      set: capitalizeFirstLetter,
    },
    notificationTextExcerpt: {
      //the short content of the notificationText to be shown in the notificationText
      type: String,
      required: true,
      set: capitalizeFirstLetter,
    },
    notificationTextYear: {
      type: String,
      required: true,
    },
    notificationTextDate: {
      type: Date,
      required: true,
    },

    notificationTextToParents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        ref: "User",
      },
    ],
    notificationTextToUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        ref: "User",
      },
    ],
    notificationTextText: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      ref: "TextNotificationTexts",
    },
    notificationTextIsRead: { type: Boolean, index: true },
  },

  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model(
  "NotificationText",
  NotificationTextSchema,
  "notificationTexts"
);
