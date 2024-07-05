const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.ObjectId ,
        required: true,
        index: true,
        unique: true
    },
    employeeJoinDate: {
        type: Date,
        required: true
    },
    employeeRole: [{
        type: String,
        default: "Employee",
        required: true,
        index: true
    }],
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
        type: Date,
        required: false
    },
    employeeWorkHistory:[{
        from:{
            type: Date,
            required: true},
        to:{type: Date,
            required: true}
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
    },

})

module.exports = mongoose.model('Employee', userSchema)


