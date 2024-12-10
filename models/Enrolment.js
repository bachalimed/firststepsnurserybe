const mongoose = require('mongoose')


const enrolmentSuspensionSchema= new mongoose.Schema({
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
	serviceAuthorisedFee: {type: String, index: true},
	serviceFinalFee: {type: String, index: true},
	enrolmentYear:{type: String, required:true, index:true},
	enrolmentMonth:{type: String, required:true, index:true},
	enrolmentNote:{type: String,  index:true},
	//enrolmentDuration:{type: String, required:true, index:true},
	//enrolmentStartDate: {type: Date, required:true},
	//enrolmentEndDate: {type: Date, required:true},
	enrolmentSuspension:[enrolmentSuspensionSchema],
	
	enrolmentInvoice:{type: mongoose.Schema.Types.ObjectId,  index:true, ref:'Invoice'},
	//enrolmentPayment:{type: mongoose.Schema.Types.ObjectId,   index:true, ref:'Payment'},//we get it from invoice and its payments
	enrolmentOperator:{type: mongoose.Schema.Types.ObjectId, required:true,ref:'User'},
	enrolmentCreator:{type: mongoose.Schema.Types.ObjectId ,ref:'User'},
	
},
	
{
   timestamps: true // Automatically create `createdAt` and `updatedAt` fields
 })
module.exports = mongoose.model('Enrolment', enrolmentSchema,'enrolments')

