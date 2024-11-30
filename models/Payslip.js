const mongoose = require("mongoose");
const User = require("./User");
const Leave = require("./Leave");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}





const payslipSalaryComponentsSchema = new mongoose.Schema(
  {
    component: { type: String, required: true, set: capitalizeFirstLetter },
    amount: { type: String, required: true },
    periodicity: { type: String, required: true, set: capitalizeFirstLetter },
    reduction:{ type: String,},
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema({
  payslipYear: { type: String, index: true, required: true },
  payslipMonth: { type: String, index: true, required: true },
  payslipEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: "Employee",
  },
  payslipIsApproved: { type: Boolean, required: true },
  payslipPaymentDate: { type: Date, required: true },
  payslipLeaveDays: [{ type: mongoose.Schema.Types.ObjectId, ref: "Leave" }],
  payslipSalaryComponents: [payslipSalaryComponentsSchema],

  payslipOperator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  payslipCreator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
module.exports = mongoose.model("Payslip", payslipSchema, "payslips");
