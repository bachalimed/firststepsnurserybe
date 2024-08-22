// const User = require('../models/User')
const AttendedSchool = require('../models/AttendedSchool')
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')

// @desc Get all attendedSchool
// @route GET 'desk/attendedSchool             
// @access Private // later we will establish authorisations
const getAllAttendedSchools = asyncHandler(async (req, res) => {
    // Get all schools from MongoDB
    const attendedSchools = await AttendedSchool.find().lean()//this will not return the extra data(lean)
    // If no students 
    if (!attendedSchools?.length) {
        console.log(attendedSchools)
        return res.status(400).json({ message: 'No attendedSchools found from attendedSchool controller with love' })
    }
    res.json(attendedSchools)
})
// // @desc getAttendedSchoolByUSerId
// // @route GET 'desk/attendedSchool/myAttendedSchool with userID passed in the body of the query             
// // @access Private // later we will establish authorisations
// const getAttendedSchoolByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const attendedSchool = await AttendedSchool.find().lean()//this will not return the extra data(lean)

//     // If no students 
//     if (!attendedSchool?.length) {
//         return res.status(400).json({ message: 'No attendedSchools found from attendedSchool controller with love' })
//     }
//     res.json(attendedSchool)
// })








//----------------------------------------------------------------------------------
// @desc Create new attendedSchool
// @route POST 'desk/attendedSchool
// @access Private
const createNewAttendedSchool = asyncHandler(async (req, res) => {
    const { attendedSchoolCreationDate, attendedSchoolPriority, attendedSchoolubject, attendedSchoolDescription, attendedSchoolCreator, attendedSchoolReference,  attendedSchoolDueDate,
        attendedSchoolResponsible, attendedSchoolAction, attendedSchooltate, attendedSchoolCompletionDate, lastModified, attendedSchoolOperator, attendedSchoolYear
      } = req.body//this will come from front end we put all the fields o fthe collection here

    //Confirm data is present in the request with all required fields
        
        if (!attendedSchoolCreationDate ||!attendedSchoolPriority ||! attendedSchoolubject ||! attendedSchoolDescription ||! attendedSchoolCreator 
            ||! attendedSchoolDueDate||! attendedSchoolResponsible||! attendedSchooltate||! lastModified.operator||! attendedSchoolYear) {
        return res.status(400).json({ message: 'All mandatory fields are required' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await AttendedSchool.findOne({attendedSchoolubject }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate&&duplicate.attendedSchoolReference== attendedSchoolReference) {
        return res.status(409).json({ message: `Duplicate attendedSchool: ${duplicate.attendedSchoolubject}, found` })
    }
  
    
    const attendedSchoolObject = { attendedSchoolCreationDate, attendedSchoolPriority, attendedSchoolubject, attendedSchoolDescription, attendedSchoolCreator, attendedSchoolReference,  attendedSchoolDueDate,
        attendedSchoolResponsible, attendedSchoolAction, attendedSchooltate, attendedSchoolCompletionDate, lastModified, attendedSchoolOperator, attendedSchoolYear}//construct new attendedSchool to be stored

    // Create and store new attendedSchool 
    const attendedSchool = await AttendedSchool.create(attendedSchoolObject)

    if (attendedSchool) { //if created 
        res.status(201).json({ message: `New attendedSchool of subject: ${attendedSchool.attendedSchoolubject}, created` })
    } else {
        res.status(400).json({ message: 'Invalid attendedSchool data received' })
    }
})




// @desc Update a attendedSchool
// @route PATCH 'desk/attendedSchool
// @access Private
const updateAttendedSchool = asyncHandler(async (req, res) => {
    const { id, attendedSchoolCreationDate, attendedSchoolPriority, attendedSchoolubject, attendedSchoolDescription, attendedSchoolCreator, attendedSchoolReference,  attendedSchoolDueDate,
        attendedSchoolResponsible, attendedSchoolAction, attendedSchooltate, attendedSchoolCompletionDate, lastModified, attendedSchoolYear  } = req.body

    // Confirm data 
    if (!attendedSchoolCreationDate ||!attendedSchoolPriority ||! attendedSchoolubject ||! attendedSchoolDescription ||! attendedSchoolCreator 
        ||! attendedSchoolDueDate||! attendedSchoolResponsible||! attendedSchooltate||! lastModified.operator||! attendedSchoolYear) {
        return res.status(400).json({ message: 'All mandatory fields required' })
    }

    // Does the attendedSchool exist to update?
    const attendedSchool = await AttendedSchool.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!attendedSchool) {
        return res.status(400).json({ message: 'AttendedSchool not found' })
    }

    // Check for duplicate 
    const duplicate = await AttendedSchool.findOne({ attendedSchoolubject }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate attendedSchool' })
    }

    attendedSchool.attendedSchoolCreationDate = attendedSchoolCreationDate//it will only allow updating properties that are already existant in the model
    attendedSchool.attendedSchoolPriority = attendedSchoolPriority
    attendedSchool.attendedSchoolubject = attendedSchoolubject
    attendedSchool.attendedSchoolDescription = attendedSchoolDescription
    attendedSchool.attendedSchoolCreator = attendedSchoolCreator
    attendedSchool.attendedSchoolReference = attendedSchoolReference
    attendedSchool.attendedSchoolDueDate = attendedSchoolDueDate
    attendedSchool.attendedSchoolResponsible = attendedSchoolResponsible
    attendedSchool.attendedSchoolAction = attendedSchoolAction
    attendedSchool.attendedSchooltate = attendedSchooltate
    attendedSchool.attendedSchoolCompletionDate = attendedSchoolCompletionDate
    attendedSchool.lastModified = lastModified
    attendedSchool.attendedSchoolYear = attendedSchoolYear
    
    
    const updatedAttendedSchool = await attendedSchool.save()//save method received when we did not include lean

    res.json({ message: `attendedSchool: ${updatedAttendedSchool.attendedSchoolubject}, updated` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteAttendedSchool = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'AttendedSchool ID Required' })
    }

    // Does the user exist to delete?
    const attendedSchool = await AttendedSchool.findById(id).exec()

    if (!attendedSchool) {
        return res.status(400).json({ message: 'AttendedSchool not found' })
    }

    const result = await attendedSchool.deleteOne()

    const reply = `attendedSchool ${attendedSchool.attendedSchoolubject}, with ID ${attendedSchool._id}, deleted`

    res.json(reply)
})



module.exports = {
    getAllAttendedSchools,
    createNewAttendedSchool,
    updateAttendedSchool,
    deleteAttendedSchool
 
}