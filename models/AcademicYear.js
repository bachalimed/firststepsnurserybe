const mongoose = require('mongoose')


const academicYearSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	
	title: {type: String, required:true, index: true},
	yearStart: {type: Date, required:true,index: true},
	yearEnd: {type: Date, required:true, index: true},
	academicYearColor:{type: String, index: true, default:"#063970"},
	academicYearCreator: {type: mongoose.Schema.Types.ObjectId, required:true,index: true, ref:'User'}
	
	})
module.exports = mongoose.model('AcademicYear', academicYearSchema,'academicYears')//the thrid is the name that will be used in the mongo collection

