// const User = require('../models/User')
const EmployeeDocumentsList = require("../models/EmployeeDocumentsList");
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all employeeDocumentsList
// @route GET 'desk/employeeDocumentsList
// @access Private // later we will establish authorisations
const getAllEmployeeDocumentsLists = asyncHandler(async (req, res) => {
  const { id } = req.query;

  if (id) {
    const employeeDocumentsList = await EmployeeDocumentsList.findOne({
      _id: id,
    }).lean(); //this will not return the extra data(lean)

    console.log(employeeDocumentsList,'employeeDocumentsList from id');
    if (!employeeDocumentsList) {
      return res
        .status(400)
        .json({ message: "No employeeDocumentsList found for the id provided" });
    }
    return res.json(employeeDocumentsList);
  }
  // Get all  from MongoDB
  const employeeDocumentsLists = await EmployeeDocumentsList.find().lean(); //this will not return the extra data(lean)

  //console.log(employeeDocumentsLists);
  if (!employeeDocumentsLists?.length) {
    return res
      .status(400)
      .json({
        message:
          "No employeeDocumentsLists found from employeeDocumentsList controller with love",
      });
  }
  res.json(employeeDocumentsLists);
});

// // @desc getEmployeeDocumentsListByUSerId
// // @route GET 'desk/employeeDocumentsList/myEmployeeDocumentsList with userID passed in the body of the query
// // @access Private // later we will establish authorisations
// const getEmployeeDocumentsListByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const employeeDocumentsList = await EmployeeDocumentsList.find().lean()//this will not return the extra data(lean)

//     // If no employees
//     if (!employeeDocumentsList?.length) {
//         return res.status(400).json({ message: 'No employeeDocumentsLists found from employeeDocumentsList controller with love' })
//     }
//     res.json(employeeDocumentsList)
// })

//----------------------------------------------------------------------------------
// @desc Create new employeeDocumentsList
// @route POST 'desk/employeeDocumentsList
// @access Private
const createNewEmployeeDocumentsList = asyncHandler(async (req, res) => {
  const { documentsList, documentsAcademicYear } = req.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !documentsAcademicYear ||
    !Array.isArray(documentsList) ||
    documentsList?.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await EmployeeDocumentsList.findOne({
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
  // Construct the employeeDocumentsList object with the updated documentsList
  const employeeDocumentsListObject = {
    documentsList: documentsWithIds,
    documentsAcademicYear,
  };

  // Create and store the new employeeDocumentsList
  const employeeDocumentsList = await EmployeeDocumentsList.create(
    employeeDocumentsListObject
  );

  if (employeeDocumentsList) {
    res
      .status(201)
      .json({
        message: `New employeeDocumentsList for ${employeeDocumentsList.documentsAcademicYear} created`,
      });
  } else {
    res
      .status(400)
      .json({ message: "Invalid employeeDocumentsList data received" });
  }
});

// @desc Update a employeeDocumentsList
// @route PATCH 'desk/employeeDocumentsList
// @access Private
const updateEmployeeDocumentsList = asyncHandler(async (req, res) => {
  const { id, documentsList, documentsAcademicYear } = req.body;

  if (
    !documentsAcademicYear ||
    !Array.isArray(documentsList) ||
    documentsList.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" });
  }

  // Does the employeeDocumentList exist to update?
  const listToUpdate = await EmployeeDocumentsList.findById(id).exec();

  if (!listToUpdate) {
    return res
      .status(400)
      .json({ message: "No EmployeeDocumentsList found to update" });
  }

  listToUpdate.documentsList = documentsList;
  listToUpdate.documentsAcademicYear = documentsAcademicYear;

  const updatedEmployeeDocumentsList = await listToUpdate.save();

  res.json({
    message: `EmployeeDocumentsList updated successfully`,
    updatedEmployeeDocumentsList,
  });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a employee
// @route DELETE 'employees/employeesParents/employees
// @access Private
const deleteEmployeeDocumentsList = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res
      .status(400)
      .json({ message: "EmployeeDocumentsList ID Required" });
  }

  // Does the user exist to delete?
  const employeeDocumentsList = await EmployeeDocumentsList.findById(id).exec();

  if (!employeeDocumentsList) {
    return res.status(400).json({ message: "EmployeeDocumentsList not found" });
  }

  const result = await employeeDocumentsList.deleteOne();

  const reply = `employeeDocumentsList ${employeeDocumentsList.employeeDocumentsListubject}, with ID ${employeeDocumentsList._id}, deleted`;

  res.json(reply);
});

module.exports = {
  getAllEmployeeDocumentsLists,
  createNewEmployeeDocumentsList,
  updateEmployeeDocumentsList,
  deleteEmployeeDocumentsList,
};
