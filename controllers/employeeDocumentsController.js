// const User = require('../models/User')
const EmployeeDocument = require('../models/EmployeeDocument')
const EmployeeDocumentsList = require('../models/EmployeeDocumentsList')
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')


// @desc Get all employeeDocuments
// @route GET 'desk/employeeDocuments             
// @access Private // later we will establish authorisations
const getAllEmployeeDocuments = asyncHandler(async (req, res) => {
const {userId,year} = req.query
     
    if(userId&&year){ 
        //console.log('showing request query params',req.query.userId,req.query.year)
        const {userId, year}= req.query
       
    try {
        // Fetch employee documents based on userId and year
        const employeeDocuments = await EmployeeDocument.find({
          userId: userId,
          employeeDocumentYear: year
        }).lean()
  
        // Fetch documents list based on year
        const employeeDocumentsList = await EmployeeDocumentsList.find({
          documentsAcademicYear: year
        }).lean();
  
        // Check if documents are found and send response
        if (employeeDocuments.length || employeeDocumentsList.length) {
            //console.log('employeeDocuments',employeeDocuments,'employeeDocumentsList',employeeDocumentsList)
            const listing =employeeDocumentsList[0].documentsList
            
            responseData = listing.map(item => {
                
                //Find the document in the employeeDocuments array that matches the documentReference
                const matchingDocument = employeeDocuments.find(doc => {
                    //console.log('Checking:', doc.employeeDocumentReference.toString(), 'against', item.documentReference.toString());
                    return doc.employeeDocumentReference.toString() === item.documentReference.toString()
                });
                //Return a new object with the documentUploaded and employeeDocumentId keys added if the reference exists
                //console.log(matchingDocument,'matchingdoc')
                return {
                    ...item,
                    documentUploaded: !!matchingDocument, // true if matchingDocument is found, false otherwise
                    employeeDocumentId: matchingDocument ? matchingDocument._id : null, // Add employeeDocumentId if found, otherwise null
                };
            });
            //console.log('responseData',responseData)
          return res.json(responseData);
        }
        // If no documents found we return an empty array toallow user to upload from table
        return res.json([]);
      } catch (error) {
        console.error('Error fetching documents:', error);
        return res.status(500).json({ message: 'Error fetching documents' });
      }
    } else {
      // Handle case where query parameters are missing
      return res.status(400).json({ message: 'Required data is missing' });
    }
  })




  const getFileById = asyncHandler(async (req, res) => {
    try {const { id } = req.params
console.log('now in the controller to get by doc id', id)
    if (!id) {
        return res.status(400).json({ message: 'Required data is missing' });
    }

    const document = await EmployeeDocument.findOne({ _id: id}).lean();

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

         // Send the file for download
         res.download(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error sending file');
            }
        });
    } catch (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
    }
});


















// // @desc getEmployeeDocumentsByUSerId
// // @route GET 'desk/employeeDocuments/myEmployeeDocuments with userID passed in the body of the query             
// // @access Private // later we will establish authorisations
// const getEmployeeDocumentsByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const employeeDocuments = await EmployeeDocuments.find().lean()//this will not return the extra data(lean)

//     // If no employees 
//     if (!employeeDocuments?.length) {
//         return res.status(400).json({ message: 'No employeeDocuments found from employeeDocuments controller with love' })
//     }
//     res.json(employeeDocuments)
// })








// //----------------------------------------------------------------------------------
// // @desc Create new employeeDocuments
// // @route POST 'employees/employeesParents//employeeDocuments
// // @access Private
// const createNewEmployeeDocument = asyncHandler(async (req, res) => {
//     const { documents, documentsAcademicYear} = req.body//this will come from front end we put all the fields o fthe collection here

//     //Confirm data is present in the request with all required fields
        
//         if (!documentsAcademicYear ||!Array.isArray(documents) ||documents?.length===0 ) {
//         return res.status(400).json({ message: 'Required data is missing' })//400 : bad request
//     }
    
//     // Check for duplicate username
//     const duplicate = await EmployeeDocuments.findOne({documentsAcademicYear }).lean().exec()//because we re receiving only one response from mongoose

//     if (duplicate) {
//         return res.status(409).json({ message: `Duplicate academicYear: ${duplicate.documentsAcademicYear}, found` })
//     }
  
    
//     const employeeDocumentsObject = { documents, documentsAcademicYear}//construct new employeeDocuments to be stored

//     // Create and store new employeeDocuments 
//     const employeeDocuments = await EmployeeDocuments.create(employeeDocumentsObject)

//     if (employeeDocuments) { //if created 
//         res.status(201).json({ message: `New employeeDocuments for : ${employeeDocuments.documentsAcademicYear}, created` })
//     } else {
//         res.status(400).json({ message: 'Invalid employeeDocuments data received' })
//     }
// })



// Route to handle file upload
const createNewEmployeeDocument = asyncHandler(async (req, res) => {
 console.log('here at the controller now')
 try {
     //console.log('Body:', req.body);
     //console.log('Files:', req.files);
     const { userId, employeeDocumentYear, employeeDocumentReference, employeeDocumentLabel } = req.body;
     const file = req.file
    // Validate required fields
    if (!userId || !employeeDocumentYear || !employeeDocumentReference || !file) {
        return res.status(400).json({ message: 'Required data is missing' });
    }
    if (!file) {
        return res.status(400).json({ message: 'File is required.' });
    }

    //ensure no other document with the same reference is already saved
    const duplicate = await  EmployeeDocument.findOne({employeeDocumentReference:employeeDocumentReference,employeeDocumentYear:employeeDocumentYear, userId:userId }).lean().exec()
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate Document type already upploadedd ' })
    }
    // Save document entry to the database
    const document = new EmployeeDocument({
        userId,
        employeeDocumentYear,
        employeeDocumentReference,
        employeeDocumentLabel,
        file: file.path, // Save the file path
    });

    await document.save()

    res.status(201).json({ message: 'Document uploaded successfully.' });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading document.' });
    }
    });


// @desc Update a employeeDocuments
// @route PATCH 'desk/employeeDocuments
// @access Private
const updateEmployeeDocument = asyncHandler(async (req, res) => {
    const { id, employeeDocumentsCreationDate, employeeDocumentsPriority, employeeDocumentsubject, employeeDocumentsDescription, employeeDocumentsCreator, employeeDocumentsReference,  employeeDocumentsDueDate,
        employeeDocumentsResponsible, employeeDocumentsAction, employeeDocumentstate, employeeDocumentsCompletionDate, lastModified, employeeDocumentsYear  } = req.body

    // Confirm data 
    if (!employeeDocumentsCreationDate ||!employeeDocumentsPriority ||! employeeDocumentsubject ||! employeeDocumentsDescription ||! employeeDocumentsCreator 
        ||! employeeDocumentsDueDate||! employeeDocumentsResponsible||! employeeDocumentstate||! lastModified.operator||! employeeDocumentsYear) {
        return res.status(400).json({ message: 'Required data is missing' })
    }

    // Does the employeeDocuments exist to update?
    const employeeDocuments = await EmployeeDocument.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!employeeDocuments) {
        return res.status(400).json({ message: 'EmployeeDocuments not found' })
    }

    // Check for duplicate 
    const duplicate = await EmployeeDocument.findOne({ employeeDocumentsubject }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate employeeDocuments' })
    }

    employeeDocuments.employeeDocumentsCreationDate = employeeDocumentsCreationDate//it will only allow updating properties that are already existant in the model
    employeeDocuments.employeeDocumentsPriority = employeeDocumentsPriority
    employeeDocuments.employeeDocumentsubject = employeeDocumentsubject
    employeeDocuments.employeeDocumentsDescription = employeeDocumentsDescription
    employeeDocuments.employeeDocumentsCreator = employeeDocumentsCreator
    employeeDocuments.employeeDocumentsReference = employeeDocumentsReference
    employeeDocuments.employeeDocumentsDueDate = employeeDocumentsDueDate
    employeeDocuments.employeeDocumentsResponsible = employeeDocumentsResponsible
    employeeDocuments.employeeDocumentsAction = employeeDocumentsAction
    employeeDocuments.employeeDocumentstate = employeeDocumentstate
    employeeDocuments.employeeDocumentsCompletionDate = employeeDocumentsCompletionDate
    employeeDocuments.lastModified = lastModified
    employeeDocuments.employeeDocumentsYear = employeeDocumentsYear
    
    
    const updatedEmployeeDocuments = await employeeDocuments.save()//save method received when we did not include lean

    res.json({ message: `Employee Documents updated successfully` })
})
//---------------------------------------------------------------------------------------1   
// @desc Delete a employee
// @route DELETE 'employees/employeesParents/employees
// @access Private
const deleteEmployeeDocument = asyncHandler(async (req, res) => {
    try {
        const  {id } = req.body
        //console.log('this is teh request' , req)
       
        
        if (!id) {
            return res.status(400).json({ message: 'Required data is missing' });
        }

        // Find the document to be deleted
        const foundDocument = await EmployeeDocument.findById(id).exec();
        
        if (!foundDocument) {
            return res.status(404).json({ message: 'Employee Document not found' });
        }

        // Optionally delete the file from the filesystem if necessary
        if (fs.existsSync(foundDocument.file)) {
            console.log('deleting', foundDocument.file)
            fs.unlinkSync(foundDocument.file);
        }

        // Delete the document from the database
        const result = await EmployeeDocument.deleteOne({ _id: id });

        // Respond with success message
        const reply = `Deleted ${result?.deletedCount} Employee Document and removed file ${foundDocument.file}`;
        res.json({ message: reply });
        
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ message: 'Error deleting document' });
    }
});



module.exports = {
    getAllEmployeeDocuments,
    createNewEmployeeDocument,
    updateEmployeeDocument,
    deleteEmployeeDocument,
    getFileById,
 
}