const mongoose = require('mongoose')


const agreedFeesSchema= new mongoose.Schema({
	service:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'Service'},
	feeValue:{type: Number, index: true},
	feePeriod:{type: String, required:true, index:true},
	feeStartDate:{type: Date, required:true, index: true},
	feeEndDate:{type: Date, index: true},
},{ _id: false })

const admissionSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	student:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref: 'Student'},
	admissionYear:{type: String, required:true, index:true},
	admissionDate: {type: Date, required:true},
	agreedFees:[agreedFeesSchema],
	
	admidsionCreator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	admidsionOperator:{type: mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'User'},
	
},
	
{
   timestamps: true // Automatically create `createdAt` and `updatedAt` fields
 })
module.exports = mongoose.model('Admission', admissionSchema,'admissions')

