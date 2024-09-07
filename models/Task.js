const mongoose = require('mongoose')

function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const taskSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	
	taskCreationDate: {type: Date, required:true, index: true},
	taskPriority: {type: String, required:true,index: true},
	taskSubject: {type: String, required:true, index: true, set : capitalizeFirstLetter},
	taskDescription: {type: String, required:true, index: true},
	taskCreator: {type: mongoose.Schema.Types.ObjectId, required:true,index: true, ref:'User'},
	taskReference: {type: String, index: true},
	taskDueDate: {type: Date, required:true, index: true},
	taskResponsible: {type: mongoose.Schema.Types.ObjectId, required:true,index: true, ref:'User'},
	taskAction:{
		actionDate: {type: Date,  index: true},
		actionDescription: {type: String,  index: true},
		actionReference: {type: String},
		actionResult:{type: String, index: true}}, 
	taskState:{type: String, required:true, index: true},
	taskCompletionDate: {type: Date, index: true},
	lastModified: {
		date: {type: Date},
		operator: {type: mongoose.Schema.Types.ObjectId, required:true, index: true, ref:'User'}},
	taskYear:{type: String, required:true, index: true}

	})
module.exports = mongoose.model('Task', taskSchema, 'tasks')

