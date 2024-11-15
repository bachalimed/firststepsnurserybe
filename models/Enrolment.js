const mongoose = require('mongoose')


const enrolementSuspensionSchema= new mongoose.Schema({
	suspensionOperator:{type: mongoose.Schema.Types.ObjectId,  index:true, ref:'User'},
	enrolmentSuspensionEffectiveDate:{type: Date, index: true},
	
},{ _id: false })

const enrolmentSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	student:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref: 'Student'},
	admission:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref: 'Admission'},
	service:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref: 'Service'},
	serviceType:{type: String, required:true, index:true},
	servicePeriod:{type: String, required:true, index:true},
	serviceAuthorisedFee: {type: Number, index: true},
	serviceFinalFee: {type: Number, index: true},
	enrolmentYear:{type: String, required:true, index:true},
	enrolmentMonth:{type: String, required:true, index:true},
	enrolmentNote:{type: String,  index:true},
	//enrolmentDuration:{type: String, required:true, index:true},
	//enrolmentStartDate: {type: Date, required:true},
	//enrolmentEndDate: {type: Date, required:true},
	enrolementSuspension:[enrolementSuspensionSchema],
	
	enrolmentInvoice:{type: mongoose.Schema.Types.ObjectId,  index:true, ref:'Invoice'},
	enrolmentPayment:{type: mongoose.Schema.Types.ObjectId,   index:true, ref:''},
	enrolementOperator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	enrolementCreator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	
},
	
{
   timestamps: true // Automatically create `createdAt` and `updatedAt` fields
 })
module.exports = mongoose.model('Enrolment', enrolmentSchema,'enrolments')

