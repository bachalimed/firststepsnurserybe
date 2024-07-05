const User = require('../models/User')
//const Note = require('../models/Note')//we might need the note module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch
const bcrypt = require('bcrypt') //to hash passwords before saving them
const mongoose = require('mongoose')

// @desc Get all users
// @route GET /admin/users              ??how to modify this route to admin/users??
// @access Private // later we will establish authorisations
const getAllUsers = asyncHandler(async (req, res) => {
    // Get all users from MongoDB
    const users = await User.find().select('-password').lean()//this will not return the password or other extra data(lean)

    // If no users 
    if (!users?.length) {
        return res.status(400).json({ message: 'No userss found' })
    }

    res.json(users)
})

//----------------------------------------------------------------------------------
// @desc Create new user
// @route POST /admin/users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { userFirstName, userMiddleName, userLastName, username, password, accessToken, IsParent, IsEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact  } = req.body//this will come from front end we put all the fields o fthe collection here

    //Confirm data is present in the request with all required fields
    if (!userFirstName ||!userLastName  || !username ||!userDob ||!password ||!userContact || !Array.isArray(userRoles) || !userRoles.length) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await User.findOne({username }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    // Hash password 
    const hashedPwd = await bcrypt.hash(password, 10) // salt roundsm we will implement it laterm normally password is without''
    
    const userObject = { userFirstName, userMiddleName, userLastName, username, "password" :hashedPwd, accessToken,  IsParent, IsEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact  }//construct new user to be stored

    // Create and store new user 
    const user = await User.create(userObject)

    if (user) { //if created 
        res.status(201).json({ message: `New user ${username} created` })
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }
})

// @desc Update a user
// @route PATCH /admin/users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, userFirstName, userMiddleName, userLastName, username, password, accessToken, isParent, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact  } = req.body

    // Confirm data 
    if (!id || !username || !Array.isArray(userRoles) || !userRoles.length || typeof userIsActive !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    // Does the user exist to update?
    const user = await User.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    // Check for duplicate 
    const duplicate = await User.findOne({ username }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    user.userFirstName = userFirstName//it will only allow updating properties that are already existant in the model
    user.userMiddleName = userMiddleName
    user.userLastName = userLastName
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

    if (password) {//only if the password is requested to be updated
        // Hash password 
        user.password = await bcrypt.hash(password, 10) // salt rounds 
    }

    const updatedUser = await user.save()//save method received when we did not include lean

    res.json({ message: `${updatedUser.username} updated` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a user
// @route DELETE /admin/users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the user still have assigned notes?
    // const note = await Note.findOne({ user: id }).lean().exec()
    // if (note) {
    //     return res.status(400).json({ message: 'User has assigned notes' })
    // }


    // Does the user exist to delete?
    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}