const mongoose = require('mongoose')

const childrenSchema = new mongoose.Schema({
    childId:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'student'},
}, { _id: false })

const familySchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	
	familyName: {type: String, required:true, index: true},
	father:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Parent'},
	mother: {type: mongoose.Schema.Types.ObjectId, index: true, ref:'Parent'},
	familySituation: {type: Date, required:true, index: true},
	
	children:[childrenSchema],
	
	})
module.exports = mongoose.model('family', familySchema,'families')//the thrid is the name that will be used in the mongo collection

