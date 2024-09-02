const mongoose = require('mongoose')

const studentEducationSchema = new mongoose.Schema({
    schoolYear: { type: String, index: true },
    attendedSchool: { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'AttendedSchool' },
    note: { type: String, index: true }
}, { _id: false }) // Disable the creation of _id for this subdocument

const studentAdmissionsSchema = new mongoose.Schema({
    admissionYear:{type: String, index: true},
	admission: {type: mongoose.Schema.Types.ObjectId, index: true, ref:''}
}, { _id: false })

const studentYearsSchema = new mongoose.Schema({
	academicYear: {type: String, index: true},
},{ _id: false })

const studentGardienSchema= new mongoose.Schema({
	gardienYear:{type: String, index: true},
	gardienFirstName:{type: String, index: true},
	gardienMiddleName:{type: String, index: true},
	gardienLastName:{type: String, index: true},
	gardienRelation:{type: String, index: true},
	gardienPhone:{type: Number}
},{ _id: false })


const studentSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	studentName:{
		firstName:{type: String, required:true, index: true},
		middleName: {type: String, index: true},
		lastName: {type: String, required:true, index: true}}, 
	studentDob:{type: Date, required:true},
	studentSex: {type: String, required:true},
	studentIsActive: {type: Boolean, index: true},
	studentGardien:[studentGardienSchema],
	studentAdmissions:[studentAdmissionsSchema],
	studentYears: [studentYearsSchema],
	studentEducation:[studentEducationSchema],		
	lastModified:{type: Date, default: Date.now},
	operator:{type: String, index: true},
}
	)
module.exports = mongoose.model('Student', studentSchema,'students')

