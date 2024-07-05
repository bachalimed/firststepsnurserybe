const mongoose = require('mongoose')

const usersSchema = new mongoose.Schema({
	
	
	userFirstName:{type: String, required:true, index: true},
    userMiddleName: {type: String, required:true, index: true},
    userLastName: {type: String, required:true, index: true}, 
	username: {type: String, required:true, index: true, unique: true},
	password: {type: String, required:true, index: true},
	accessToken: {type: String, required:false, index: true},
	isParent:{
		type: String ,
		// type: mongoose.ObjectId ,
		required:false},
	isEmployee:{
		type: String ,
		// type: mongoose.ObjectId ,
		required:false},
	userDob:{
		type: Date,
		required:true},
	userIsActive:{
		type: Boolean,
		required:true},
	userRoles:[{
		type: String,
		required: true,
		index: true}],
	userPhoto: {
		label:{type: String},
		location:{type: String},
		size:{type: Number},
		format:{type: String}	
		},
	userAddress: {
		house:{
			type: String,
			required:true},
		street:{
			type: String,
			required:true},
		area:{
			type: String,
			required:true},
		city:{
			type: String,
			required:true}	
		},
	userContact: {
		primaryPhone:{
			type: Number,
			required:true},
		secondaryPhone:{
			type: Number,
			required:true},
		email:{
			type: String,
			required:true}}
	
	})

module.exports = mongoose.model('users', usersSchema)

