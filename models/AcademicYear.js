const mongoose = require('mongoose')


const academicYearsSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	
	title: {type: String, required:true, index: true},
	yearStart: {type: Date, required:true,index: true},
	yearEnd: {type: Date, required:true, index: true},
	currentYear: {type: Boolean, required:true, index: true},
	academicYearCreator: {type: mongoose.Schema.Types.ObjectId, required:true,index: true}
	
	})
module.exports = mongoose.model('AcademicYear', academicYearsSchema,'academicYears')//the thrid is the name that will be used in the mongo collection
