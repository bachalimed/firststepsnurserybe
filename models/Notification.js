const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const notificationUsersSchema = new mongoose.Schema({}, { _id: false });

const NotificationSchema = new mongoose.Schema(
  {
    notificationType: {
      //Receipt, payment reminder, information
      type: String,
      set: capitalizeFirstLetter,
    },
    notificationPayment: {
      //related to payment
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    notificationIsToBeSent: { type: Boolean, index: true }, //if the system setitings sending option is avaialble or not will be recorded on the notification

    notificationLeave: {
      //related to Leave
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
    },
    notificationAdmission: {
      //related to admission
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
    },
    notificationExpense: {
      //related to admission
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
    },
    notificationTitle: {
      //the content of the notification
      type: String,
      required: true,
      set: capitalizeFirstLetter,
    },
    notificationContent: {
      //the content of the notification
      type: String,
      required: true,
      set: capitalizeFirstLetter,
    },
    notificationExcerpt: {
      //the short content of the notification to be shown in the notification
      type: String,
      required: true,
      set: capitalizeFirstLetter,
    },
    notificationYear: {
      type: String,
      required: true,
    },
    notificationDate: {
      type: Date,
      required: true,
    },

    notificationToParents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        ref: "User",
      },
    ],
    notificationToUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        ref: "User",
      },
    ],
    notificationText: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      ref: "TextNotifications",
    },
    notificationIsRead: [
      {
        type: mongoose.Schema.Types.ObjectId,
        
        index: true,
        ref: "User",
      },
    ],
  },

  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model(
  "Notification",
  NotificationSchema,
  "notifications"
);
