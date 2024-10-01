const mongoose = require('mongoose')


const enrolementSuspensionSchema= new mongoose.Schema({
	suspensionOperator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	enrolmentSuspensionEffectiveDate:{type: Date, required:true, index: true},
	
},{ _id: false })

const enrolmentSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	student:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref: 'Student'},
	service:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref: 'Service'},
	enrolmentYear:{type: String, required:true, index:true},
	enrolmentDuration:{type: String, required:true, index:true},
	enrolmentStartDate: {type: Date, required:true},
	enrolmentEndDate: {type: Date},
	enrolementSuspension:[enrolementSuspensionSchema],
	
	enrolmentInvoice:{type: mongoose.Schema.Types.ObjectId,  index:true, ref:''},
	enrolmentPayment:{type: mongoose.Schema.Types.ObjectId, required:true,  index:true, ref:''},
	enrolementOperator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	enrolementCreator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	
},
	
{
   timestamps: true // Automatically create `createdAt` and `updatedAt` fields
 })
module.exports = mongoose.model('Enrolment', enrolmentSchema,'enrolments')

