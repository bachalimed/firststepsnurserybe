// const User = require('../models/User')
const StudentDocument = require('../models/StudentDocument')
const StudentDocumentsList = require('../models/StudentDocumentsList')
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')

// @desc Get all studentDocuments
// @route GET 'desk/studentDocuments             
// @access Private // later we will establish authorisations
const getAllStudentDocuments = asyncHandler(async (req, res) => {

     console.log('now get studetn by year&id')
    if(req.query.studentId&&req.query.year){ 
        //console.log('showing request query params',req.query.studentId,req.query.year)
        const {studentId, year}= req.query
       
    try {
        // Fetch student documents based on studentId and year
        const studentDocuments = await StudentDocument.find({
          studentId: studentId,
          studentDocumentYear: year
        }).lean()
  
        // Fetch documents list based on year
        const studentDocumentsList = await StudentDocumentsList.find({
          documentsAcademicYear: year
        }).lean();
  
        // Check if documents are found and send response
        if (studentDocuments.length || studentDocumentsList.length) {
          const responseData = { studentDocuments, studentDocumentsList };
          return res.json(responseData);
        }
  
        // If no documents found
        return res.status(404).json({ message: 'No student documents found' });
      } catch (error) {
        console.error('Error fetching documents:', error);
        return res.status(500).json({ message: 'Error fetching documents' });
      }
    } else {
      // Handle case where query parameters are missing
      return res.status(400).json({ message: 'studentId and year query parameters are required' });
    }
  })




  const getFileById = asyncHandler(async (req, res) => {
    const { id } = req.params
console.log('now in the controller to get by doc id', req.params)
    if (!id) {
        return res.status(400).json({ message: 'Missing required parameters: id' });
    }

    const document = await StudentDocument.findOne({ _id: id}).lean();

    if (!document) {
        return res.status(404).json({ message: 'Document not found' });
    }
   
    const filePath = document.file;

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }

   
    
    // Determine the correct content type
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    // Send the file
    res.download(path.resolve(filePath), (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error sending file');
        }
    });


});


















// // @desc getStudentDocumentsByUSerId
// // @route GET 'desk/studentDocuments/myStudentDocuments with userID passed in the body of the query             
// // @access Private // later we will establish authorisations
// const getStudentDocumentsByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const studentDocuments = await StudentDocuments.find().lean()//this will not return the extra data(lean)

//     // If no students 
//     if (!studentDocuments?.length) {
//         return res.status(400).json({ message: 'No studentDocuments found from studentDocuments controller with love' })
//     }
//     res.json(studentDocuments)
// })








// //----------------------------------------------------------------------------------
// // @desc Create new studentDocuments
// // @route POST 'students/studentsParents//studentDocuments
// // @access Private
// const createNewStudentDocument = asyncHandler(async (req, res) => {
//     const { documents, documentsAcademicYear} = req.body//this will come from front end we put all the fields o fthe collection here

//     //Confirm data is present in the request with all required fields
        
//         if (!documentsAcademicYear ||!Array.isArray(documents) ||documents?.length===0 ) {
//         return res.status(400).json({ message: 'All mandatory fields are required' })//400 : bad request
//     }
    
//     // Check for duplicate username
//     const duplicate = await StudentDocuments.findOne({documentsAcademicYear }).lean().exec()//because we re receiving only one response from mongoose

//     if (duplicate) {
//         return res.status(409).json({ message: `Duplicate academicYear: ${duplicate.documentsAcademicYear}, found` })
//     }
  
    
//     const studentDocumentsObject = { documents, documentsAcademicYear}//construct new studentDocuments to be stored

//     // Create and store new studentDocuments 
//     const studentDocuments = await StudentDocuments.create(studentDocumentsObject)

//     if (studentDocuments) { //if created 
//         res.status(201).json({ message: `New studentDocuments for : ${studentDocuments.documentsAcademicYear}, created` })
//     } else {
//         res.status(400).json({ message: 'Invalid studentDocuments data received' })
//     }
// })



// Route to handle file upload
const createNewStudentDocument = asyncHandler(async (req, res) => {
 console.log('here at the controller now')
 try {
     console.log('Body:', req.body);
     console.log('Files:', req.files);
     const { studentId, studentDocumentYear, studentDocumentReference, studentDocumentLabel } = req.body;
     const file = req.file
    // Validate required fields
    if (!studentId || !studentDocumentYear || !studentDocumentReference || !file) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (!file) {
        return res.status(400).json({ message: 'File is required.' });
    }

    // Save document entry to the database
    const document = new StudentDocument({
        studentId,
        studentDocumentYear,
        studentDocumentReference,
        studentDocumentLabel,
        file: file.path, // Save the file path
    });

    await document.save()

    res.status(201).json({ message: 'Document uploaded successfully.' });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading document.' });
    }
    });


// @desc Update a studentDocuments
// @route PATCH 'desk/studentDocuments
// @access Private
const updateStudentDocument = asyncHandler(async (req, res) => {
    const { id, studentDocumentsCreationDate, studentDocumentsPriority, studentDocumentsubject, studentDocumentsDescription, studentDocumentsCreator, studentDocumentsReference,  studentDocumentsDueDate,
        studentDocumentsResponsible, studentDocumentsAction, studentDocumentstate, studentDocumentsCompletionDate, lastModified, studentDocumentsYear  } = req.body

    // Confirm data 
    if (!studentDocumentsCreationDate ||!studentDocumentsPriority ||! studentDocumentsubject ||! studentDocumentsDescription ||! studentDocumentsCreator 
        ||! studentDocumentsDueDate||! studentDocumentsResponsible||! studentDocumentstate||! lastModified.operator||! studentDocumentsYear) {
        return res.status(400).json({ message: 'All mandatory fields required' })
    }

    // Does the studentDocuments exist to update?
    const studentDocuments = await StudentDocuments.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!studentDocuments) {
        return res.status(400).json({ message: 'StudentDocuments not found' })
    }

    // Check for duplicate 
    const duplicate = await StudentDocuments.findOne({ studentDocumentsubject }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate studentDocuments' })
    }

    studentDocuments.studentDocumentsCreationDate = studentDocumentsCreationDate//it will only allow updating properties that are already existant in the model
    studentDocuments.studentDocumentsPriority = studentDocumentsPriority
    studentDocuments.studentDocumentsubject = studentDocumentsubject
    studentDocuments.studentDocumentsDescription = studentDocumentsDescription
    studentDocuments.studentDocumentsCreator = studentDocumentsCreator
    studentDocuments.studentDocumentsReference = studentDocumentsReference
    studentDocuments.studentDocumentsDueDate = studentDocumentsDueDate
    studentDocuments.studentDocumentsResponsible = studentDocumentsResponsible
    studentDocuments.studentDocumentsAction = studentDocumentsAction
    studentDocuments.studentDocumentstate = studentDocumentstate
    studentDocuments.studentDocumentsCompletionDate = studentDocumentsCompletionDate
    studentDocuments.lastModified = lastModified
    studentDocuments.studentDocumentsYear = studentDocumentsYear
    
    
    const updatedStudentDocuments = await studentDocuments.save()//save method received when we did not include lean

    res.json({ message: `studentDocuments: ${updatedStudentDocuments.studentDocumentsubject}, updated` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteStudentDocument = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'StudentDocuments ID Required' })
    }

    // Does the user exist to delete?
    const studentDocuments = await StudentDocuments.findById(id).exec()

    if (!studentDocuments) {
        return res.status(400).json({ message: 'StudentDocuments not found' })
    }

    const result = await studentDocuments.deleteOne()

    const reply = `studentDocuments ${studentDocuments.studentDocumentsubject}, with ID ${studentDocuments._id}, deleted`

    res.json(reply)
})



module.exports = {
    getAllStudentDocuments,
    createNewStudentDocument,
    updateStudentDocument,
    deleteStudentDocument,
    getFileById,
 
}