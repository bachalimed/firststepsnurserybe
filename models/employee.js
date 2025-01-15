const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const employeeYearsSchema = new mongoose.Schema(
  {
    academicYear: { type: String, index: true },
  },
  { _id: false }
);

const employeeAssessmentSchema = new mongoose.Schema(
  {
    employeeAssessment: {
      date: { type: Date },
      assessor: { type: String },
      assessmentComment: { type: String },
      assessmentScore: { type: String },
    },
  },
  { _id: false }
);
const salaryPackageSchema = new mongoose.Schema(
  {
    salaryFrom: { type: Date, required: true },
    salaryTo: { type: Date, default: null },
    basicSalary: { type: String, required: true },
    deduction: {
      deductionLabel: { type: String },
      deductionAmount: { type: String },
    },
    allowances: [
      {
        allowanceLabel: { type: String, set: capitalizeFirstLetter },
        allowanceUnitValue: { type: String },
        allowancePeriodicity: { type: String },
      },
    ],

    // paymentPeriod: { type: String, required: true },//monthly, hourly
  },
  { _id: false }
);

const employeeWorkHistorySchema = new mongoose.Schema(
  {
    employeeWorkHistory: {
      institution: { type: String, set: capitalizeFirstLetter },
      fromDate: { type: Date },
      toDate: { type: Date },
      position: { type: String, set: capitalizeFirstLetter },
      contractType: { type: String, set: capitalizeFirstLetter },
      salaryPackage: { type: String },
    },
  },
  { _id: false }
);


const employeeSchema = new mongoose.Schema({
  employeeCurrentEmployment: {
    position: { type: String, required: true, set: capitalizeFirstLetter },
    employeeColor: { type: String, default: "#597833" },
    joinDate: { type: Date, required: true },
    contractType: { type: String, required: true, set: capitalizeFirstLetter },
  },
  salaryPackage: [salaryPackageSchema],
  employeeIsActive: { type: Boolean },
  employeeYears: [employeeYearsSchema],
  employeeAssessment: [employeeAssessmentSchema],
  employeeWorkHistory: [employeeWorkHistorySchema],
});
module.exports = mongoose.model("Employee", employeeSchema, "employees");
