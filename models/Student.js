const mongoose = require('mongoose')

function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
const studentEducationSchema = new mongoose.Schema({
    schoolYear: { type: String, index: true, required:true, },

    attendedSchool: { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'AttendedSchool' },
    note: { type: String, index: true }
}, { _id: false }) // Disable the creation of _id for this subdocument

// const studentAdmissionsSchema = new mongoose.Schema({
//     admissionYear:{type: String, index: true},
// 	admission: {type: mongoose.Schema.Types.ObjectId, index: true, ref:''}
// }, { _id: false })

const studentYearsSchema = new mongoose.Schema({
	academicYear: {type: String, index: true},
	grade:{type: String,  index: true},
	admission:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Admission'}
},{ _id: false })

const studentGardienSchema= new mongoose.Schema({
	gardienYear:{type: String, index: true},
	gardienFirstName:{type: String, index: true, set:capitalizeFirstLetter},
	gardienMiddleName:{type: String, index: true, set:capitalizeFirstLetter},
	gardienLastName:{type: String, index: true, set:capitalizeFirstLetter},
	gardienRelation:{type: String, index: true, set:capitalizeFirstLetter},
	gardienPhone:{type: Number}
},{ _id: false })

const studentSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	studentName:{
		firstName:{type: String, required:true, index: true, set:capitalizeFirstLetter},
		middleName: {type: String, index: true, set:capitalizeFirstLetter},
		lastName: {type: String, required:true, index: true , set:capitalizeFirstLetter}}, 
	studentDob:{type: Date, required:true},
	studentSex: {type: String, required:true},
	studentIsActive: {type: Boolean, index: true},
	//studentJointFamily:{type: Boolean, index: true},
	studentGardien:[studentGardienSchema],
	//studentAdmissions:[studentAdmissionsSchema],
	studentYears: [studentYearsSchema],
	studentColor:{type: String, index: true, default:'#00bdae'},
	studentEducation:[studentEducationSchema],		
	studentSection:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Section'},
	operator:{type: mongoose.Schema.Types.ObjectId,  ref:'User'},
	creator:{type: mongoose.Schema.Types.ObjectId,  ref:'User'},
	//studentFather:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Parent'},
	//studentMother:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Parent'}
}	,
{
   timestamps: true // Automatically create `createdAt` and `updatedAt` fields
 }
	)
module.exports = mongoose.model('Student', studentSchema,'students')
