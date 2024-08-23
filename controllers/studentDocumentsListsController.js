// const User = require('../models/User')
const StudentDocumentsList = require('../models/StudentDocumentsList')
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')

// @desc Get all studentDocumentsList
// @route GET 'desk/studentDocumentsList             
// @access Private // later we will establish authorisations
const getAllStudentDocumentsLists = asyncHandler(async (req, res) => {
    // Get all schools from MongoDB
    const studentDocumentsLists = await StudentDocumentsList.find().lean()//this will not return the extra data(lean)
    // If no students 
    console.log(studentDocumentsLists)
    if (!studentDocumentsLists?.length) {
        return res.status(400).json({ message: 'No studentDocumentsLists found from studentDocumentsList controller with love' })
    }
    res.json(studentDocumentsLists)
})
// // @desc getStudentDocumentsListByUSerId
// // @route GET 'desk/studentDocumentsList/myStudentDocumentsList with userID passed in the body of the query             
// // @access Private // later we will establish authorisations
// const getStudentDocumentsListByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const studentDocumentsList = await StudentDocumentsList.find().lean()//this will not return the extra data(lean)

//     // If no students 
//     if (!studentDocumentsList?.length) {
//         return res.status(400).json({ message: 'No studentDocumentsLists found from studentDocumentsList controller with love' })
//     }
//     res.json(studentDocumentsList)
// })








//----------------------------------------------------------------------------------
// @desc Create new studentDocumentsList
// @route POST 'desk/studentDocumentsList
// @access Private
const createNewStudentDocumentsList = asyncHandler(async (req, res) => {
    const { documentsList, documentsAcademicYear} = req.body//this will come from front end we put all the fields o fthe collection here

    //Confirm data is present in the request with all required fields
        
        if (!documentsAcademicYear ||!Array.isArray(documentsList) ||documentsList?.length===0 ) {
        return res.status(400).json({ message: 'All mandatory fields are required' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await StudentDocumentsList.findOne({documentsAcademicYear }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {
        return res.status(409).json({ message: `Duplicate academicYear: ${duplicate.documentsAcademicYear}, found` })
    }
  
    
    const studentDocumentsListObject = { documentsList, documentsAcademicYear}//construct new studentDocumentsList to be stored

    // Create and store new studentDocumentsList 
    const studentDocumentsList = await StudentDocumentsList.create(studentDocumentsListObject)

    if (studentDocumentsList) { //if created 
        res.status(201).json({ message: `New studentDocumentsList for : ${studentDocumentsList.documentsAcademicYear}, created` })
    } else {
        res.status(400).json({ message: 'Invalid studentDocumentsList data received' })
    }
})




// @desc Update a studentDocumentsList
// @route PATCH 'desk/studentDocumentsList
// @access Private
const updateStudentDocumentsList = asyncHandler(async (req, res) => {
    const { id, studentDocumentsListCreationDate, studentDocumentsListPriority, studentDocumentsListubject, studentDocumentsListDescription, studentDocumentsListCreator, studentDocumentsListReference,  studentDocumentsListDueDate,
        studentDocumentsListResponsible, studentDocumentsListAction, studentDocumentsListtate, studentDocumentsListCompletionDate, lastModified, studentDocumentsListYear  } = req.body

    // Confirm data 
    if (!studentDocumentsListCreationDate ||!studentDocumentsListPriority ||! studentDocumentsListubject ||! studentDocumentsListDescription ||! studentDocumentsListCreator 
        ||! studentDocumentsListDueDate||! studentDocumentsListResponsible||! studentDocumentsListtate||! lastModified.operator||! studentDocumentsListYear) {
        return res.status(400).json({ message: 'All mandatory fields required' })
    }

    // Does the studentDocumentsList exist to update?
    const studentDocumentsList = await StudentDocumentsList.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!studentDocumentsList) {
        return res.status(400).json({ message: 'StudentDocumentsList not found' })
    }

    // Check for duplicate 
    const duplicate = await StudentDocumentsList.findOne({ studentDocumentsListubject }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate studentDocumentsList' })
    }

    studentDocumentsList.studentDocumentsListCreationDate = studentDocumentsListCreationDate//it will only allow updating properties that are already existant in the model
    studentDocumentsList.studentDocumentsListPriority = studentDocumentsListPriority
    studentDocumentsList.studentDocumentsListubject = studentDocumentsListubject
    studentDocumentsList.studentDocumentsListDescription = studentDocumentsListDescription
    studentDocumentsList.studentDocumentsListCreator = studentDocumentsListCreator
    studentDocumentsList.studentDocumentsListReference = studentDocumentsListReference
    studentDocumentsList.studentDocumentsListDueDate = studentDocumentsListDueDate
    studentDocumentsList.studentDocumentsListResponsible = studentDocumentsListResponsible
    studentDocumentsList.studentDocumentsListAction = studentDocumentsListAction
    studentDocumentsList.studentDocumentsListtate = studentDocumentsListtate
    studentDocumentsList.studentDocumentsListCompletionDate = studentDocumentsListCompletionDate
    studentDocumentsList.lastModified = lastModified
    studentDocumentsList.studentDocumentsListYear = studentDocumentsListYear
    
    
    const updatedStudentDocumentsList = await studentDocumentsList.save()//save method received when we did not include lean

    res.json({ message: `studentDocumentsList: ${updatedStudentDocumentsList.studentDocumentsListubject}, updated` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteStudentDocumentsList = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'StudentDocumentsList ID Required' })
    }

    // Does the user exist to delete?
    const studentDocumentsList = await StudentDocumentsList.findById(id).exec()

    if (!studentDocumentsList) {
        return res.status(400).json({ message: 'StudentDocumentsList not found' })
    }

    const result = await studentDocumentsList.deleteOne()

    const reply = `studentDocumentsList ${studentDocumentsList.studentDocumentsListubject}, with ID ${studentDocumentsList._id}, deleted`

    res.json(reply)
})



module.exports = {
    getAllStudentDocumentsLists,
    createNewStudentDocumentsList,
    updateStudentDocumentsList,
    deleteStudentDocumentsList
 
}