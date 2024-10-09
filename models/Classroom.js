const mongoose = require('mongoose')
function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}



const classroomSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	classroomNumber:{type: Number, required:true, index: true}, 
	classroomLabel:{type: String, required:true, set: capitalizeFirstLetter},
	classroomCapacity:{type: Number, required:true},
	classroomMaxCapacity:{type: Number, required:true},
	
}
	)
module.exports = mongoose.model('classroom', classroomSchema,'classrooms')

