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
	studentMother:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Parent'},
	studentFather:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Parent'},
	studentJointFamily:{type: Boolean},
	studentYears: [{academicYear: {type: String, index: true}}],
	studentGardien:[
		{academicYear:{type: String, index: true},
		gardienFirstName:{type: String, index: true},
		gardienMiddleName:{type: String, index: true},
		gardienLastName:{type: String, index: true},
		gardienRelation:{type: String, index: true},
		gardienPhone:{type: Number}}],
	studentDocuments:[{
		academicYear:{type: String, index: true},
		id: {type: mongoose.Schema.Types.ObjectId, index: true, ref:''},
		}],
	
	studentPhoto:[{
		academicYear:{type: String, index: true},
		photoId: {type: mongoose.Schema.Types.ObjectId, index: true, ref:''},
		}],
	studentEducation:[{
		academicYear:{type: String, index: true},
		attendedSchool:{type: mongoose.Schema.Types.ObjectId, index: true, ref:''},
		note:{type: String, index: true}
	}],		
	lastModified:{
		date:{type: Date},
		operator:{type: String, index: true}},
		
	studentAdmissions:[{
		academicYear:{type: String, index: true},
		admission: {type: mongoose.Schema.Types.ObjectId, index: true, ref:''}}]
	}
	)
module.exports = mongoose.model('Student', studentSchema,'students')

