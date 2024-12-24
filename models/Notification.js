// const mongoose = require("mongoose");

// function capitalizeFirstLetter(str) {
//   if (typeof str !== "string" || str.length === 0) return str;
//   return str.charAt(0).toUpperCase() + str.slice(1);
// }

// const NotificationSchema = new mongoose.Schema(
//   {
//     notificationType: {
//       type: String,

//       set: capitalizeFirstLetter,
//     },
//     notificationLabel: {
//       type: String,
//       required: true,
//       set: capitalizeFirstLetter,
//     },
//     notificationYear: {
//       type: String,
//       required: true,
//     },
//     notificationAnimator: {
//       type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the notification
//       ref: "Employee",
//       required: true,
//     },

//     students: [
//       {
//         type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the notification
//         ref: "Student",
//       },
//     ],
//     notificationColor: { type: String, index: true, default: "#5978ee" },
//     notificationType: {
//       type: String,
//     },

//     notificationFrom: {
//       type: Date,
//       required: true,
//     },
//     notificationTo: {
//       //the current notification will not have an ending date
//       type: Date,
//       default: null,
//     },

//     notificationLocation: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Classroom",
//       required: true,
//     },
//     operator: {
//       type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the notification
//       ref: "User",
//       required: true,
//     },
//     creator: {
//       type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the notification
//       ref: "User",
//       required: true,
//     },
//   },

//   {
//     timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
//   }
// );

// // Index for faster queries on recurring notifications
// NotificationSchema.index({ startTime: 1, endTime: 1 });

// module.exports = mongoose.model(
//   "Notification",
//   NotificationSchema,
//   "notifications"
// );
