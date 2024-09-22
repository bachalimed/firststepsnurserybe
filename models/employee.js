const mongoose = require("mongoose");
const User = require("./User");


const employeeYearsSchema = new mongoose.Schema({
	academicYear: {type: String, index: true},
},{ _id: false })

const employeeAssessmentSchema = new mongoose.Schema({
    employeeAssessment:{
        date: { type: Date },
        assessor: { type: String },
        assessmentComment: { type: String },
        assessmentScore: { type: Number },
      },
},{ _id: false })


const employeeWorkHistorySchema = new mongoose.Schema({
    employeeWorkHistory:{
        from: {
          type: Date,
          required: true,
        },
        to: { type: Date },
      },
},{ _id: false })

const employeeSchema = new mongoose.Schema({
  emloyeeJoinDate: {
    type: Date,
    required: true,
  },
  
  employeeDepartureDate: {
      type: Date,
    },
  employeeIsActive: {
      type: Boolean,
    },
    
    employeeContractType: {
        type: String,
        required: true,
    },
    employeeSalary: {
        type: Number,
        required: true,
    },
    employeePayment: {
        type: String,
        required: true,
    },
    employeeYears: [employeeYearsSchema],
    employeeAssessment: [employeeAssessmentSchema ],
    employeeWorkHistory: [employeeWorkHistorySchema],
});
module.exports = mongoose.model("Employee", employeeSchema, "employees");
