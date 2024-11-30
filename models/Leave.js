const mongoose = require("mongoose");
const User = require("./User");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const leaveSchema = new mongoose.Schema({
  leaveYear: { type: String, index: true, required: true },
  leaveMonth: { type: String, index: true, required: true },
  leaveEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: "Employee",
  },
  leaveIsApproved: { type: Boolean, required: true },
  leaveIsPaidLeave: { type: Boolean, required: true },
  leaveIsSickLeave: { type: Boolean, required: true },
  leaveIsPartDay: { type: Boolean, required: true },
  leaveStartDate: { type: Date, required: true },
  leaveEndDate: { type: Date, required: true },

  leaveComment: { type: String, set: capitalizeFirstLetter },
  leaveOperator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  leaveCreator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
module.exports = mongoose.model("Leave", leaveSchema, "leaves");
