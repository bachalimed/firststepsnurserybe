const mongoose = require('mongoose')

const childrenSchema = new mongoose.Schema({
    child:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'Student'},
}, { _id: false })

const familySchema = new mongoose.Schema({
	father:{type: mongoose.Schema.Types.ObjectId, index: true, ref:'User'},
	mother: {type: mongoose.Schema.Types.ObjectId, index: true, ref:'User'},
	familySituation: {type: String, index: true},
	children:[childrenSchema],
	
	})
module.exports = mongoose.model('Family', familySchema,'families')//the thrid is the name that will be used in the mongo collection
