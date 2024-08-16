const mongoose = require('mongoose')




const studentSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	studentName:{
		firstName:{type: String, required:true, index: true},
		middleName: {type: String, index: true},
		lastName: {type: String, required:true, index: true}}, 
	studentDob:{type: Date, required:true},
	studentSex: {type: String, required:true},
	studentIsActive: {type: Boolean, index: true},
	studentYear: {type: String, index: true},
	studentPhoto: {type: String},
		
	
	studentMother:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Parent'},
	studentFather:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Parent'},
	studentJointFamily:{type: Boolean},
	studentGardien:[
        {gardienFirstName:{type: String, index: true},
		gardienMiddleName:{type: String, index: true},
		gardienLastName:{type: String, index: true},
		gardienRelation:{type: String, index: true},
		gardienPhone:{type: Number}}],
	studentEducation:[
		{schoolyear:{type: String},
		attendedSchool:{type: mongoose.Schema.Types.ObjectId, index: true, ref:''},
		note:{type: String, index: true}}],
		
	lastModified:{
		date:{type: Date},
		operator:{type: String, index: true}},
	studentDocuments:[
		{id: {type: mongoose.Schema.Types.ObjectId, index: true, ref:''}}],
	admissions:[
			{schoolYear:{type: String}, admission:{type: mongoose.Schema.Types.ObjectId, index: true, ref:''}}],
	})
module.exports = mongoose.model('Student', studentSchema,'students')

