// const User = require('../models/User')
const StudentDocument = require('../models/StudentDocument')
const StudentDocumentsList = require('../models/StudentDocumentsList')
const Family = require('../models/Family')
const Student = require('../models/Student')

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
const {studentId,year, familyId,criteria} = req.query
     //console.log('now get studetn by year&id')
    if(studentId&&year){ 
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
           // console.log('studentDocuments',studentDocuments,'studentDocumentsList',studentDocumentsList)
            const listing =studentDocumentsList[0].documentsList
            
            responseData = listing.map(item => {
                
                //Find the document in the studentDocuments array that matches the documentReference
                const matchingDocument = studentDocuments.find(doc => {
                    //console.log('Checking:', doc.studentDocumentReference.toString(), 'against', item.documentReference.toString());
                    return doc.studentDocumentReference.toString() === item.documentReference.toString()
                });
                //Return a new object with the documentUploaded and studentDocumentId keys added if the reference exists
                //console.log(matchingDocument,'matchingdoc')
                return {
                    ...item,
                    documentUploaded: !!matchingDocument, // true if matchingDocument is found, false otherwise
                    studentDocumentId: matchingDocument ? matchingDocument._id : null, // Add studentDocumentId if found, otherwise null
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
    } if (familyId && year && criteria === "OnlyPhotos") {
        //console.log(familyId, criteria);
        try {
          // Step 1: Retrieve family data
          const family = await Family.findById(familyId).lean(); // Fetch family by ID
    
          if (!family) {
            throw new Error("Family not found");
          }
    
          // Step 2: Fetch the student documents for the given year and document titles
          const titles = ["Father Photo", "Mother Photo", "Student Photo"]; // Define the titles you're interested in
          const studentDocumentsListt = await fetchStudentDocuments(year, titles); // Fetch documents
    
        //   console.log(
        //     studentDocumentsListt[0],
        //     "studentDocumentlistttttttttttttttttttttttt 00"
        //   );
          // Step 3: Loop over the children and attach relevant documents (Father, Mother, and Student Photo)
          const fatherPhoto = await StudentDocument.findOne({
            studentId: family.children[0].child, // Assuming you're looking for the first child in the family
            studentDocumentReference: {
              $in: studentDocumentsListt.flatMap(
                (item) =>
                  // Access the `documentsList` array and filter for documents with `documentTitle === 'Father Photo'`
                  item.documentsList
                    .filter((document) => document.documentTitle === "Father Photo")
                    .map((document) => document.documentReference) // Get the `documentReference` for those documents
              ),
            },
          }).lean();
    
          // console.log(fatherPhoto,'fatherPhoto')
    
          const motherPhoto = await StudentDocument.findOne({
            studentId: family.children[0].child, // Assuming you're looking for the first child in the family
            studentDocumentReference: {
              $in: studentDocumentsListt.flatMap(
                (item) =>
                  // Access the `documentsList` array and filter for documents with `documentTitle === 'Father Photo'`
                  item.documentsList
                    .filter((document) => document.documentTitle === "Mother Photo")
                    .map((document) => document.documentReference) // Get the `documentReference` for those documents
              ),
            },
          }).lean();
    
          // Attach father and mother photos to the family data
          if (fatherPhoto) {
            family.fatherPhotoId = fatherPhoto?._id; // Or any other way you want to append
          }
    
          if (motherPhoto) {
            family.motherPhotoId = motherPhoto?._id;
          }
    
          // Async function to flatten studentPhotos and append them directly under the `family` object
await family.children.reduce(async (accPromise, child) => {
    // Resolve the accumulator promise
    await accPromise;
  
    // Find the relevant StudentDocument for the current child
    const studentPhoto = await StudentDocument.findOne({
      studentId: child.child, // Assuming `child.child` is the correct field for the student ID
      studentDocumentReference: {
        $in: studentDocumentsListt.flatMap(
          (item) =>
            // Access the `documentsList` array and filter for documents with `documentTitle === 'Student Photo'`
            item.documentsList
              .filter((document) => document.documentTitle === "Student Photo")
              .map((document) => document.documentReference) // Get the `documentReference` for those documents
        ),
      },
    }).lean();
  
    // Append the studentPhoto ID to the `family` object directly
    if (!family.studentPhotos) {
      family.studentPhotos = {}; // Initialize `studentPhotos` if not already present
    }
  
    // Add the photo information directly under `family.studentPhotos`
    family[`child${family.children.indexOf(child) + 1}Id`] = child.child;
    family[`child${family.children.indexOf(child) + 1}PhotoId`] = studentPhoto ? studentPhoto._id : null;
  
    // Also update the child object itself if needed
    if (studentPhoto) {
      child.studentPhoto = studentPhoto._id;
    }
  
    // Return a resolved promise to continue the next iteration
    return Promise.resolve();
  }, Promise.resolve());
  
    family.children=null
          
    
          // Step 4: Return the modified family data
    
          return res.json(family);
        } catch (error) {
          console.error("Error fetching family data with documents:", error);
          throw error;
        }
      } else {
        // Handle case where query parameters are missing
    
        return res
          .status(400)
          .json({ message: "query parameters are required" });
      }
    });
    





    const fetchStudentDocuments = async (year, titles) => {
        try {
          // Fetch the student documents that match the year
          const studentDocumentsListt = await StudentDocumentsList.find({
            documentsAcademicYear: year,
          }).lean();
      
          // Filter the documentsList array for each document to only include the specified titles
          const filteredDocuments = studentDocumentsListt.map((doc) => {
            // Filter the documentsList to include only the titles in the 'titles' array
            doc.documentsList = doc.documentsList.filter((document) =>
              titles.includes(document.documentTitle)
            );
      
            return doc;
          });
      
          //console.log(filteredDocuments, 'filteredDocuments'); // Log the filtered documents
          return filteredDocuments;
        } catch (error) {
          console.error("Error fetching student documents:", error);
          throw error;
        }
      }; 
    
    
   
  



//query the file directly
  const getFileById = asyncHandler(async (req, res) => {
    try {const { id } = req.params
console.log('now in the controller to get by doc id', id)
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
     //console.log('Body:', req.body);
     //console.log('Files:', req.files);
     const { studentId, studentDocumentYear, studentDocumentReference, studentDocumentLabel } = req.body;
     const file = req.file
    // Validate required fields
    if (!studentId || !studentDocumentYear || !studentDocumentReference || !file) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (!file) {
        return res.status(400).json({ message: 'File is required.' });
    }

    //ensure no other document with the same reference is already saved
    const duplicate = await  StudentDocument.findOne({studentDocumentReference:studentDocumentReference,studentDocumentYear:studentDocumentYear, studentId:studentId }).lean().exec()
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate Document type already upploadedd ' })
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
    const studentDocuments = await StudentDocument.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!studentDocuments) {
        return res.status(400).json({ message: 'StudentDocuments not found' })
    }

    // Check for duplicate 
    const duplicate = await StudentDocument.findOne({ studentDocumentsubject }).lean().exec()

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
//---------------------------------------------------------------------------------------1   
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteStudentDocument = asyncHandler(async (req, res) => {
    try {
        const  {id } = req.body
        //console.log('this is teh request' , req)
       
        
        if (!id) {
            return res.status(400).json({ message: 'Missing required parameter: id ' });
        }

        // Find the document to be deleted
        const foundDocument = await StudentDocument.findById(id).exec();
        
        if (!foundDocument) {
            return res.status(404).json({ message: 'Student Document not found' });
        }

        // Optionally delete the file from the filesystem if necessary
        if (fs.existsSync(foundDocument.file)) {
            console.log('deleting', foundDocument.file)
            fs.unlinkSync(foundDocument.file);
        }

        // Delete the document from the database
        await StudentDocument.deleteOne({ _id: id });

        // Respond with success message
        const reply = `Student Document with ID ${id} and file ${foundDocument.file} deleted`;
        res.json({ message: reply });
        
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ message: 'Error deleting document' });
    }
});



module.exports = {
    getAllStudentDocuments,
    createNewStudentDocument,
    updateStudentDocument,
    deleteStudentDocument,
    getFileById,
 
}