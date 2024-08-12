const mongoose = require('mongoose')


const usersSchema = new mongoose.Schema({
	//id is already assigned automatically by mongo
	userFullName:{
	userFirstName:{type: String, required:true, index: true},
    userMiddleName: {type: String, index: true},
    userLastName: {type: String, required:true, index: true}}, 
	username: {type: String, index: true, unique: true},
	password: {type: String, required:true, index: true},
	accessToken: {type: String, index: true},
	isParent:{
		type: mongoose.Schema.Types.ObjectId} ,
		// type: mongoose.ObjectId ,
	isEmployee:{
		type: mongoose.Schema.Types.ObjectId ,
		// type: mongoose.ObjectId ,
		},
	userDob:{
		type: Date,
		required:true},
	userIsActive:{
		type: Boolean,
		required:true,
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
			type: String,
			required:true},
		area:{type: String},
		postCode:{type: String},
		city:{
			type: String,
			required:true}	
		},
	userContact: {
		primaryPhone:{
			type: Number,
			required:true},
		secondaryPhone:{
			type: Number
			},
		email:{
			type: String,
			required:true}}
	
	})
module.exports = mongoose.model('User', usersSchema,'users')

