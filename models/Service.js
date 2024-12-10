const mongoose = require('mongoose')


function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const serviceSchema = new mongoose.Schema({
	serviceType:{type: String, index: true, required:true, set:capitalizeFirstLetter},
	serviceYear: {type: String, index: true, required:true},
	serviceAnchor: {
	monthly:{type: String, index: true},
	weekly:{type: String, index: true},
	oneTimeOff:{type: String, index: true},
	},
	serviceCreator: {type: mongoose.Schema.Types.ObjectId, index: true, required:true, ref:'User'},
	serviceOperator: {type: mongoose.Schema.Types.ObjectId, index: true, required:true, ref:'User'},
},
	
	 {
		timestamps: true // Automatically create `createdAt` and `updatedAt` fields
	  })
module.exports = mongoose.model('Service', serviceSchema,'services')//the thrid is the name that will be used in the mongo collection
