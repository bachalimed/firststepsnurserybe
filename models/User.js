const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	userFullName:{
	userFirstName:{type: String, required:true, index: true},
    userMiddleName: {type: String, index: true},
    userLastName: {type: String, required:true, index: true}}, 
	username: {type: String, index: true, unique: true},
	password: {type: String, required:true, index: true},
	accessToken: {type: String, index: true},
	isParent:{
		type: mongoose.Schema.Types.ObjectId,
		ref:'Parent'},
		
	isEmployee:{
		type: mongoose.Schema.Types.ObjectId,
		ref:'Employee'
		
		},
	userDob:{
		type: Date,
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
		required: true,
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

