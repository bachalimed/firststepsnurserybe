const mongoose = require('mongoose')




const studentsSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	studentName:{
		firstName:{type: String, required:true, index: true},
		middleName: {type: String, index: true},
		lastName: {type: String, required:true, index: true}}, 
	studentDob:{type: Date, required:true},
	studentSex: {type: String, required:true},
	studentIsActive: {type: Boolean, index: true},
	studentYear: {type: String, index: true},
	studentPhoto: {
		label:{type: String},
		location:{type: String},
		size:{type: Number},
		format:{type: String}	
		},
	studentParent:{
		studentMother:{type: mongoose.Schema.Types.ObjectId, index: true},
		studentFather:{type: mongoose.Schema.Types.ObjectId, index: true}},
	studentContact:{
		fatherPhone:{type: Number},
		motherPhone:{type: Number}},
	studentJointFamily:{type: Boolean},
	studentGardien:[
        {gardienFirstName:{type: String, index: true},
            gardienMiddleName:{type: String, index: true},
            gardienlastName:{type: String, index: true},
            gardienPhone:{type: Number}}],
	studentEducation:[
		{schoolyear:{type: String},
		attendedSchool:{type: String, index: true},
		note:{type: String, index: true}}],
		
	lastModified:{
		date:{type: Date},
		operator:{type: String, index: true}},
	studentDocuments:[
		{id: {type: String}}],
	admissions:[
			{schoolYear:{type: String}, admission:{type: String}}],
	})
module.exports = mongoose.model('Student', studentsSchema,'students')

