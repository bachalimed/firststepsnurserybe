const mongoose = require('mongoose')

function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}



const payeeSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	payeeLabel:{type: String, required:true, index: true, set:capitalizeFirstLetter},
	payeeYears:[{type: String,}],
	payeePhone:{type: String,},
	payeeAddress:{type: String,},
	payeeNotes: {type: String, },
	payeeIsActive: {type: Boolean, index: true},
	payeeOperator:{type: mongoose.Schema.Types.ObjectId,  ref:'User'},
	payeeCreator:{type: mongoose.Schema.Types.ObjectId,  ref:'User'},
	payeeCategories:[{type: String,}],
}	,
{
   timestamps: true // Automatically create `createdAt` and `updatedAt` fields
 }
	)
module.exports = mongoose.model('Payee', payeeSchema,'payees')
