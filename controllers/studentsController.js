// const User = require('../models/User')
const Student = require('../models/Student')//we might need the parent module in this controller
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')

// @desc Get all students
// @route GET 'students/studentsParents/students             
// @access Private // later we will establish authorisations
const getAllStudents = asyncHandler(async (req, res) => {
    // Get all students from MongoDB
    const students = await Student.find().lean()//this will not return the extra data(lean)

    // If no students 
    if (!students?.length) {
        return res.status(400).json({ message: 'No studentss found' })
    }
    res.json(students)
})

//----------------------------------------------------------------------------------
// @desc Create new user
// @route POST 'students/studentsParents/students
// @access Private
const createNewStudent = asyncHandler(async (req, res) => {
    const { studentName, studentDob,  studentSex, studentIsActive, studentYear, studentPhoto, studentParent,
         studentContact, studentJointFamily, studentGardien, studentEducation, lastModified, studentDocuments, 
         admissions   } = req.body//this will come from front end we put all the fields o fthe collection here

    //Confirm data is present in the request with all required fields
    if (!studentName || !studentDob ||!studentSex ||!studentYear ||!Array.isArray(studentEducation) || !studentEducation.length) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await Student.findOne({studentName }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate student name' })
    }

    // Check for duplicate userFullName
    const duplicateFamily = await Student.findOne({studentParent }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicateFamily) {
        return res.status(409).json({ message: 'Duplicate parents found' })
    }
    
    
    const studentObject = { studentName, studentDob,  studentSex, studentIsActive, studentYear, studentPhoto, studentParent,
        studentContact, studentJointFamily, studentGardien, studentEducation, lastModified, studentDocuments, 
        admissions }//construct new student to be stored

    // Create and store new student 
    const student = await Student.create(studentObject)

    if (student) { //if created 
        res.status(201).json({ message: `New student ${studentName.firstName} created` })
    } else {
        res.status(400).json({ message: 'Invalid student data received' })
    }
})
//internalcontroller :CreateNew User to be used by other controllers??







// // @desc Update a user
// // @route PATCH 'students/studentsParents/students
// // @access Private
// const updateUser = asyncHandler(async (req, res) => {
//     const { id, userFullName, username, password, accessToken, isParent, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact  } = req.body

//     // Confirm data 
//     if (!id || !username || !Array.isArray(userRoles) || !userRoles.length || typeof userIsActive !== 'boolean') {
//         return res.status(400).json({ message: 'All fields except password are required' })
//     }

//     // Does the user exist to update?
//     const user = await User.findById(id).exec()//we did not lean becausse we need the save method attached to the response

//     if (!user) {
//         return res.status(400).json({ message: 'User not found' })
//     }

//     // Check for duplicate 
//     const duplicate = await User.findOne({ username }).lean().exec()

//     // Allow updates to the original user 
//     if (duplicate && duplicate?._id.toString() !== id) {
//         return res.status(409).json({ message: 'Duplicate username' })
//     }

//     user.userFullName = userFullName//it will only allow updating properties that are already existant in the model
//     user.username = username
//     user.userRoles = userRoles
//     user.accessToken = accessToken
//     user.isParent = isParent
//     user.isEmployee = isEmployee
//     user.userDob = userDob
//     user.userIsActive = userIsActive
//     user.userRoles = userRoles
//     user.userPhoto = userPhoto
//     user.userAddress =userAddress
//     user.userContact =userContact

//     if (password) {//only if the password is requested to be updated
//         // Hash password 
//         user.password = await bcrypt.hash(password, 10) // salt rounds 
//     }

//     const updatedUser = await user.save()//save method received when we did not include lean

//     res.json({ message: `${updatedUser.username} updated` })
// })
// //--------------------------------------------------------------------------------------1   
// // @desc Delete a user
// // @route DELETE 'students/studentsParents/students
// // @access Private
// const deleteUser = asyncHandler(async (req, res) => {
//     const { id } = req.body

//     // Confirm data
//     if (!id) {
//         return res.status(400).json({ message: 'User ID Required' })
//     }

//     // Does the user still have assigned notes?
//     // const note = await Note.findOne({ user: id }).lean().exec()
//     // if (note) {
//     //     return res.status(400).json({ message: 'User has assigned notes' })
//     // }


//     // Does the user exist to delete?
//     const user = await User.findById(id).exec()

//     if (!user) {
//         return res.status(400).json({ message: 'User not found' })
//     }

//     const result = await user.deleteOne()

//     const reply = `Username ${result.username} with ID ${result._id} deleted`

//     res.json(reply)
// })







module.exports = {
    getAllStudents,
    createNewStudent,
    // updateStudent,
    // deleteStudent
    
}