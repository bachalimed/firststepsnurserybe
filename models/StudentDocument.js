const mongoose = require('mongoose')




const studentDocumentSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	
	studentId:{type: mongoose.Schema.Types.ObjectId, index: true, required:true, ref:'Student'},
	file: {type: String, required:true},
	studentDocumentReference: {type: mongoose.Schema.Types.ObjectId, index: true, required:true, ref:'StudentDocumentsList'}, 
	studentDocumentYear:{type: String, required:true},
	studentDocumentLabel: {type: String},
	
	}
	)
module.exports = mongoose.model('StudentDocument', studentDocumentSchema,'studentDocuments')
