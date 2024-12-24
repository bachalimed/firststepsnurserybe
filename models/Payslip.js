const mongoose = require("mongoose");
const User = require("./User");
const Leave = require("./Leave");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}





const payslipWorkDaysSchema = new mongoose.Schema(
  {
    day: { type: Date, required: true, },
    dayType: { type: String, required: true },
    isPaid:{ type: Boolean,required: true,},
    isWeekend: { type: Boolean,},
    isSickLeave:{ type: Boolean,},
    isPartDay:{ type: Boolean,},
    partdayDuration:{ type: String,},
    isGiven:{ type: Boolean,},
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema({
  payslipYear: { type: String, index: true, required: true },
  payslipMonth: { type: String, index: true, required: true },
  payslipWorkdays:[payslipWorkDaysSchema],
  payslipNote: { type: String, index: true,  },
  payslipEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: "Employee",
  },
  payslipEmployeeName:{ type: String, index: true, required: true,set: capitalizeFirstLetter },
  payslipIsApproved: { type: Boolean, required: true },
  payslipPaymentDate: { type: Date, },
  payslipLeaveDays: [{ type: mongoose.Schema.Types.ObjectId, ref: "Leave" }],
  //payslipSalaryComponents: [payslipSalaryComponentsSchema],
  payslipSalaryComponents: {
        basic: { type: String, required: true,  },
        payableBasic: { type: String, required: true,  },
        allowance: { type: String, required: true, set: capitalizeFirstLetter },
        totalAmount: { type: String, required: true },
        //reduction:{ type: String,},
      },

  payslipOperator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  payslipCreator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
module.exports = mongoose.model("Payslip", payslipSchema, "payslips");
