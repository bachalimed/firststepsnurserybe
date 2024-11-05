const mongoose = require('mongoose')


const agreedServicesSchema= new mongoose.Schema({//fee can be changed in the middle of the year with an arrangement
	service:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'Service'},
	feeValue:{type: Number, index: true},
	feePeriod:{type: String, required:true, index:true},
	feeStartDate:{type: Date, required:true, index: true},
	feeMonths:[{type: String, required:true,  index:true}],
	//feeEndDate:{type: Date, index: true},
	isFlagged:{type: Boolean, required:true, index:true},
	isAuthorised:{type: Boolean, required:true, index:true},
	authorisedBy:{type: mongoose.Schema.Types.ObjectId, index:true, ref:'User'},
	comment:{type: String,  index:true}
},{ _id: false })


const admissionSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	student:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref: 'Student'},
	admissionYear:{type: String, required:true, index:true},
	admissionDate: {type: Date, required:true},
	agreedServices:[agreedServicesSchema],
	
	admissionCreator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	admissionOperator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	
},
	
{
   timestamps: true // Automatically create `createdAt` and `updatedAt` fields
 })
module.exports = mongoose.model('Admission', admissionSchema,'admissions')

