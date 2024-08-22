const mongoose = require('mongoose')




const attendedSchoolSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	schoolName:{type: String, required:true, index: true}, 
	schoolCity:{type: String, required:true},
	schoolType: {type: String, required:true},
}
	)
module.exports = mongoose.model('attendedSchool', attendedSchoolSchema,'attendedSchools')

