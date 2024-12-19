// const User = require('../models/User')
const StudentDocumentsList = require("../models/StudentDocumentsList");
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all studentDocumentsList
// @route GET 'desk/studentDocumentsList
// @access Private // later we will establish authorisations
const getAllStudentDocumentsLists = asyncHandler(async (req, res) => {
  const { id } = req.query;

  if (id) {
    const studentDocumentsList = await StudentDocumentsList.findOne({
      _id: id,
    }).lean(); //this will not return the extra data(lean)

    //console.log(studentDocumentsList,'studentDocumentsList from id');
    if (!studentDocumentsList) {
      return res
        .status(400)
        .json({ message: "No studentDocumentsList found for the id provided" });
    }
    return res.json(studentDocumentsList);
  }
  // Get all  from MongoDB
  const studentDocumentsLists = await StudentDocumentsList.find().lean(); //this will not return the extra data(lean)

  //console.log(studentDocumentsLists);
  if (!studentDocumentsLists?.length) {
    return res
      .status(400)
      .json({
        message:
          "No studentDocumentsLists found from studentDocumentsList",
      });
  }
  res.json(studentDocumentsLists);
});

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
  const { documentsList, documentsAcademicYear } = req.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !documentsAcademicYear ||
    !Array.isArray(documentsList) ||
    documentsList?.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Required data is missing" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await StudentDocumentsList.findOne({
    documentsAcademicYear,
  })
    .lean()
    .exec(); //because we re receiving only one response from mongoose

  if (duplicate) {
    return res
      .status(409)
      .json({
        message: `Duplicate academicYear: ${duplicate.documentsAcademicYear}, found`,
      });
  }

  // Add ObjectId to each document in the documentsList
  const documentsWithIds = documentsList.map((doc) => ({
    ...doc,
    documentReference: new mongoose.Types.ObjectId(),
  }));
  // Construct the studentDocumentsList object with the updated documentsList
  const studentDocumentsListObject = {
    documentsList: documentsWithIds,
    documentsAcademicYear,
  };

  // Create and store the new studentDocumentsList
  const studentDocumentsList = await StudentDocumentsList.create(
    studentDocumentsListObject
  );

  if (studentDocumentsList) {
    res
      .status(201)
      .json({
        message: `Student documents' list created successfully`,
      });
  } else {
    res
      .status(400)
      .json({ message: "Invalid data received" });
  }
});

// @desc Update a studentDocumentsList
// @route PATCH 'desk/studentDocumentsList
// @access Private
const updateStudentDocumentsList = asyncHandler(async (req, res) => {
  const { id, documentsList, documentsAcademicYear } = req.body;

  if (
    !documentsAcademicYear ||
    !Array.isArray(documentsList) ||
    documentsList.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Required data is missing" });
  }

  // Does the studentDocumentList exist to update?
  const listToUpdate = await StudentDocumentsList.findById(id).exec();

  if (!listToUpdate) {
    return res
      .status(400)
      .json({ message: "No StudentDocumentsList found to update" });
  }

  listToUpdate.documentsList = documentsList;
  listToUpdate.documentsAcademicYear = documentsAcademicYear;

  const updatedStudentDocumentsList = await listToUpdate.save();

  res.json({
    message: `Student documents list updated successfully`,
    updatedStudentDocumentsList,
  });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteStudentDocumentsList = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res
      .status(400)
      .json({ message: "Required data is missing" });
  }

  // Does the user exist to delete?
  const studentDocumentsList = await StudentDocumentsList.findById(id).exec();

  if (!studentDocumentsList) {
    return res.status(400).json({ message: "StudentDocumentsList not found" });
  }

  const result = await studentDocumentsList.deleteOne();

  const reply = `Deleted ${result?.deletedCount} list`;

  return res.json({message:reply});
});

module.exports = {
  getAllStudentDocumentsLists,
  createNewStudentDocumentsList,
  updateStudentDocumentsList,
  deleteStudentDocumentsList,
};
