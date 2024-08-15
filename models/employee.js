const mongoose = require('mongoose')
const User = require ('./User')

const employeeSchema = new mongoose.Schema({
   emloyeeJoinDate: {
        type: Date,
        required: true
    },

    employeeDocuments: [{
        type: String,
        required: false
    }],
    employeeAssessment:[
        {date:{type: Date},
        assessor:{type: String},
        assessmentComment:{type: String},
        assessmentScore:{type: Number}}],
    employeeDepartureDate:{
        type: Date},
    employeeWorkHistory:[{
        from:{
            type: Date,
            required: true},
        to:{type: Date}
        }],
    employeeContractType:{
        type: String,
        required: true
    },
    employeeSalary:{
        type: Number,
        required: true
    },
    employeePayment:{
        type: String,
        required: true
    }

})
module.exports = mongoose.model('Employee', employeeSchema,'employees')



