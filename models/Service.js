const mongoose = require('mongoose')


function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}



const serviceSchema = new mongoose.Schema({
	serviceType:{type: String, index: true, required:true, set:capitalizeFirstLetter},
	servicePeriodicity: {type: String, index: true, required:true, set:capitalizeFirstLetter},
	serviceYear: {type: String, index: true, required:true, set:capitalizeFirstLetter},
	fee: {type: Number, index: true, required:true},
	
	
	})
module.exports = mongoose.model('service', serviceSchema,'services')//the thrid is the name that will be used in the mongo collection
