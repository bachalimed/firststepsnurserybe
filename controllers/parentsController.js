const Parent = require('../models/Parent')
const User = require('../models/User')//we might need the user controller with this model

// const studentController = require ('../controllers/studentsController')
// const Student = require ('../models/Student')
const asyncHandler = require('express-async-handler')//instead of using try catch
const bcrypt = require('bcrypt') //to hash passwords before saving them
const mongoose = require('mongoose')

// @desc Get all parents
// @route GET /students/studentsParents/parents              
// @access Private // later we will establish authorisations
const getAllParents = asyncHandler(async (req, res) => {
    // Get all parents from MongoDB
    const parents = await Parent.find().lean()

    // If no users 
    if (!parents?.length) {
        return res.status(400).json({ message: 'No parentss found' })
    }
    res.json(parents)
})

//----------------------------------------------------------------------------------
//@desc Create new parent, check how to save user and parent from the same form
//@route POST /students/studentsParents/parents
//@access Private
//first we save the studentsm then user then parent
const createNewParent = asyncHandler(async (req, res) => {
    const { userFullName, username, password, accessToken, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact, parentYear, child, partner } = req.body//this will come from front end we put all the fields ofthe collection here

    //Confirm data for parent is present in the request with all required fields, data for user will be checked by the user controller
    if ( !parentYear ||!child  ) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    // Check for duplicate parent by checking duplicate children
    const duplicateChild = await Parent.findOne({ child: child }).lean().exec()
    if (duplicateChild) {
        return res.status(409).json({ message: `Duplicate child found:${child} ` })//get the child name from student collection
    }
    
    //Confirm data is present in the request with all required fields
    if (!userFullName || !username ||!userDob ||!password ||!userContact || !Array.isArray(userRoles) || !userRoles.length) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await User.findOne({username }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    // Check for duplicate userFullName
    const duplicateName = await User.findOne({userFullName }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicateName) {
        return res.status(409).json({ message: 'Duplicate Full name' })
    }
    
    // Hash password 
    const hashedPwd = await bcrypt.hash(password, 10) // salt roundsm we will implement it laterm normally password is without''
    
    
  //prepare new parent to be stored
    //get the user Id to store it with parent
    //const createdUserId = await User.findOne({username }).lean()/////////////////////
    ///const parentUserId= createdUserId._id/////////
    const parentObject = { parentYear, child, partner }//construct new parent to be stored
  
//  store new parent 
const parent = await Parent.create(parentObject)
  

    if (parent) { //if created we will create the parent inside the if statement
        // res.status(201).json({ message: `New user ${username} created` })
  
           // Create and store new user 
                const createdParent = await Parent.findOne({partner }).lean()
                const isParent = createdParent._id
                const userObject = { userFullName, username, "password" :hashedPwd, accessToken,  isParent, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact  }//construct new user to be stored

        const user = await User.create(userObject)
         
         if (user) { //if created 
             
             //the following line res is not being executed and was causing the error [ERR_HTTP_HEADERS_SENT, now we send both res for user and parent  together in ne line
             res.status(201).json({ message: `New user ${username+","} and new parent ${userFullName.userFirstName+" "+userFullName.userMiddleName+" "+userFullName.userLastName+","} created` })//change parentYear later to show the parent full name
     } else { //delete the user already craeted to be done
 
         res.status(400).json({ message: 'Invalid parent data received' })
     }

    } else { 
        res.status(400).json({ message: 'Invalid user data received' })
        
    }
       
})//we need to delete the user if the parent is not saved



// @desc Update a parent, we will retrieve all information from user and parent and update and save in both collections
// @route PATCH /students/studentsParents/parents
// @access Private
const updateParent = asyncHandler(async (req, res) => {
    const { id, userFullName, username, password, accessToken, isParent, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact,parentYear, child, partner  } = req.body

    // Confirm data 
    if (!id || !username || !Array.isArray(userRoles) || !userRoles.length || typeof userIsActive !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    // Does the user exist to update?
    const user = await User.findById(id).exec()//we did not lean becausse we need the save method attached to the response
    const parent= await Parent.findOne({_id:isParent}).exec() //find the parent with the id from the user

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }
    if (!parent) {
        return res.status(400).json({ message: 'Parent not found' })
    }

    // Check for duplicate 
    const duplicate = await User.findOne({ username }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    user.userFullName = userFullName//it will only allow updating properties that are already existant in the model
    user.username = username
    user.userRoles = userRoles
    user.accessToken = accessToken
    user.isParent = isParent
    user.isEmployee = isEmployee
    user.userDob = userDob
    user.userIsActive = userIsActive
    user.userRoles = userRoles
    user.userPhoto = userPhoto
    user.userAddress =userAddress
    user.userContact =userContact
    parent.parentYear=parentYear
    parent.child=child
    parent.partner=partner

    if (password) {//only if the password is requested to be updated
        // Hash password 
        user.password = await bcrypt.hash(password, 10) // salt rounds 
    }

    const updatedUser = await user.save()//save method received when we did not include lean
    

    // res.json({ message: `${updatedUser.username} updated` })



    if (updatedUser) { //if updated we will update the parent inside the if statement
        
        const updatedParent = await parent.save()
         
        
         if (updatedParent) { //if updated the parent 
               
             res.json({ message: ` ${updatedUser.username} updated, and parent ${updatedUser.userFullName.userFirstName+" "+updatedUser.userFullName.userMiddleName+" "+updatedUser.userFullName.userLastName+","} updated` })//change parentYear later to show the parent full name
     } else { //delete the user already craeted to be done later
 
         res.status(400).json({ message: 'Invalid parent data received' })
     }

    } else { 
        res.status(400).json({ message: 'Invalid user data received' })       
    }

})


//--------------------------------------------------------------------------------------1   
// @desc Delete a parent, if no isEmployee, then delete the user orelse delete only parent and keep its user, if students are active dont delete
// @route DELETE /students/studentsParents/parents
// @access Private
const deleteParent = asyncHandler(async (req, res) => {//uses parent id
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the parent still have assigned active students?
    // const student = await Student.findOne({ parent: id }).lean().exec()
    // if (student) {
    //     return res.status(400).json({ message: 'Parent has assigned active students' })//to be checked later
    // }


    // Does the parent exist to delete?
    const parent = await Parent.findById(id).exec()

    if (!parent) {
        return res.status(400).json({ message: 'Parent not found' })
    }
    const user = await User.findOne({isParent:id})
    
    if (!user) {
        return res.status(400).json({ message: 'corresponding User not found' })
    }
    //if user is also an employee, delete only the parent collection and keep user
    if(user.isEmployee){
        const result1 = await parent.deleteOne()
        const reply = `parent ${result1.id} deleted`
       res.json(reply)
    } else{

         const result1 = await parent.deleteOne()
        	const result2 = await user.deleteOne()
			console.log(result2)

        	const reply = `Username ${user.username} deleted, parent ${user.userFullName.userFirstName + " " + user.userFullName.userMiddleName+ " "+ user.userFullName.userLastName} deleted`

			  res.json(reply)
		}

})
module.exports = {
    getAllParents,
    createNewParent,
    updateParent,
    deleteParent
}