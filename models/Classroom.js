const mongoose = require('mongoose')
function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}



const classroomSchema = new mongoose.Schema({

	classroomNumber:{type: String, required:true, index: true}, 
	classroomLabel:{type: String, required:true, set: capitalizeFirstLetter},
	classroomColor:{type: String,  default: '#ff5627'},
	classroomCapacity:{type: String, required:true},
	classroomMaxCapacity:{type: String, required:true},
	
}
	)
module.exports = mongoose.model('Classroom', classroomSchema,'classrooms')

