const mongoose = require('mongoose')

function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}



const expenseCategorySchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	expenseCategoryLabel:{type: String, required:true, index: true, set:capitalizeFirstLetter},
	expenseCategoryYears:[{type: String,required:true,}],
	expenseCategoryItems:[{type: String,required:true, set:capitalizeFirstLetter}],
	expenseCategoryIsActive:[{type: Boolean,required:true,}],
	expenseCategoryService:{type: mongoose.Schema.Types.ObjectId, required:true, ref:'Service'},
	expenseCategoryOperator:{type: mongoose.Schema.Types.ObjectId,  ref:'User'},
	expenseCategoryCreator:{type: mongoose.Schema.Types.ObjectId,  ref:'User'},
	
}	,
{
   timestamps: true // Automatically create `createdAt` and `updatedAt` fields
 }
	)
module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema,'expenseCategories')
