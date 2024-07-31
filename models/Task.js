const mongoose = require('mongoose')


const tasksSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	
	taskCreationDate: {type: Date, required:true, index: true},
	taskPriority: {type: String, required:true,index: true},
	taskSubject: {type: String, required:true, index: true},
	taskDescription: {type: String, required:true, index: true},
	taskCreator: {type: mongoose.Schema.Types.ObjectId, required:true,index: true},
	taskReference: {type: String, index: true},
	taskDueDate: {type: Date, required:true, index: true},
	taskResponsible: {type: String, required:true, index: true},
	taskAction:{
		actionDate: {type: Date,  index: true},
		actionDescription: {type: String,  index: true},
		actionReference: {type: String},
		actionResponsible: {type: String, index: true},
		actionResult:{type: String, index: true},}, 
	taskState:{type: String, required:true, index: true},
	taskCompletionDate: {type: Date, index: true},
	lastModified: {
		date: {type: Date},
		operator: {type: mongoose.Schema.Types.ObjectId, required:true, index: true}},
	taskYear:{type: String, required:true, index: true}

	})
module.exports = mongoose.model('Task', tasksSchema, 'tasks')

