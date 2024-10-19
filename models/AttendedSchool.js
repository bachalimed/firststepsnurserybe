const mongoose = require('mongoose')
function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}



const attendedSchoolSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	schoolName:{type: String, required:true, index: true, set: capitalizeFirstLetter}, 
	schoolCity:{type: String, required:true, set: capitalizeFirstLetter},
	schoolType: {type: String, required:true},
	schoolColor:{type: String, required:true},
}
	)
module.exports = mongoose.model('AttendedSchool', attendedSchoolSchema,'attendedSchools')

