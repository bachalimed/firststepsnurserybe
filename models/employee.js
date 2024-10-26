const mongoose = require("mongoose");
const User = require("./User");


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
      assessor: { type: String,  },
      assessmentComment: { type: String },
      assessmentScore: { type: Number },
    },
  },
  { _id: false }
);

const employeeWorkHistorySchema = new mongoose.Schema(
  {
    employeeWorkHistory: {
		institution:{type: String,  set: capitalizeFirstLetter,},
      fromDate: { type: Date },
      toDate: { type: Date },
      position: { type: String,  set: capitalizeFirstLetter, },
      contractType: { type: String,  set: capitalizeFirstLetter, },
      salaryPackage: { 
		basic:{type: Number },
		cnss:{type: Number},
		other:{type: Number },
	 },
    },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema({
  	employeeCurrentEmployment: {
		//position: { type: String, required: true, set: capitalizeFirstLetter, },
		employeeColor: { type: String, default:'#597833' },
		joinDate: { type: Date, required: true },
		contractType: { type: String, required: true, set: capitalizeFirstLetter, },
		salaryPackage: { 
			payment: { type: String, required: true },
			basic:{type: Number, required: true },
			cnss:{type: Number},
			other:{type: Number },
	 },
  },
  employeeIsActive: { type: Boolean },
  employeeYears: [employeeYearsSchema],
  employeeAssessment: [employeeAssessmentSchema],
  employeeWorkHistory: [employeeWorkHistorySchema],
});
module.exports = mongoose.model("Employee", employeeSchema, "employees");
