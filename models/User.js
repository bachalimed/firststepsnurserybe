const mongoose = require('mongoose')

function capitalizeFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
const userSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	userFullName:{
		userFirstName:{type: String, required:true, index: true, set:capitalizeFirstLetter},
    	userMiddleName: {type: String, index: true, set:capitalizeFirstLetter},
    	userLastName: {type: String, required:true, index: true, set:capitalizeFirstLetter}
	}, 
	username: {type: String, required:true, index: true, unique: true},
	password: {type: String, required:true, index: true},
	accessToken: {type: String, index: true},
	// isParent:{
	// 	type: mongoose.Schema.Types.ObjectId,
	// 	index: true,
	// 	ref:'Family'},
		
	// isEmployee:{
	// 	type: mongoose.Schema.Types.ObjectId,
	// 	index: true,
	// 	ref:'Employee'
		
	// 	},
	userDob:{
		type: Date,
		required:true,
		},
	userSex:{
		type: String,
		required:true},
	userIsActive:{
		type: Boolean,
		
		default:true},
	userRoles:[{
		type: String,
		required: true,
		index: true}],
	userAllowedActions:[{
		type: String,
		
	}],
	userPhoto:{type: String},
	// userPhotoLabel:{type: String},
	// userPhotoFormat:{type: String},
	userAddress: {
		house:{type: String},
		street:{
			type: String
			},
		area:{type: String},
		postCode:{type: String},
		city:{
			type: String,
			}	
		},
	userContact: {
		primaryPhone:{
			type: Number,
			},
		secondaryPhone:{
			type: Number
			},
		email:{
			type: String,
			}}
	
	})
module.exports = mongoose.model('User', userSchema,'users')

