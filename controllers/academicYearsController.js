const AcademicYear = require("../models/AcademicYear");

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all academicYears
// @route GET '/settings/academicsSet/academicYears/'            ??how to modify this route to admin/academicYears is in serve.js and academicYearRoutes
// @access Private // later we will establish authorisations
const getAllAcademicYears = asyncHandler(async (req, res) => {
  // Get all academicYears from MongoDB
  const academicYears = await AcademicYear.find().lean(); //this will not return  other extra data(lean)

  // If no academicYears
  if (!academicYears?.length) {
    return res.status(400).json({ message: "No academicYears found" });
  } else {
    res.status(200).json({ academicYears, total: academicYears.length });
    //console.log('returned academicYears')
  }
});

//----------------------------------------------------------------------------------
// @desc Create new academicYear
// @route POST '/settings/academicsSet/academicYears/'
// @access Private
const createNewAcademicYear = asyncHandler(async (req, res) => {
  const { title, yearStart, yearEnd, academicYearCreator } = req.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields
  if (!title || !yearStart || !yearEnd || !academicYearCreator) {
    return res.status(400).json({ message: "Required fields are missing" }); //400 : bad request
  }

  // Check for duplicate academicYearname
  const duplicate = await AcademicYear.findOne({ yearStart }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate academicYear found" });
  }

  const academicYearObject = { title, yearStart, yearEnd, academicYearCreator }; //construct new academicYear to be stored

  // Create and store new academicYear
  const academicYear = await AcademicYear.create(academicYearObject);

  if (academicYear) {
    //if created
    res
      .status(201)
      .json({ message: `Academic Year ${academicYear.title} created` });
  } else {
    res.status(400).json({ message: "Invalid academic Year data received" });
  }
});

// @desc Update a academicYear
// @route PATCH '/settings/academicsSet/academicYears/'
// @access Private
const updateAcademicYear = asyncHandler(async (req, res) => {
  const { id, title, yearStart, yearEnd, academicYearCreator } = req.body;

  // Confirm data
  if (!id || !title || !yearStart || !yearEnd || !academicYearCreator) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  // Does the academicYear exist to update?
  const academicYear = await AcademicYear.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!academicYear) {
    return res.status(400).json({ message: `Academic year not found` });
  }

  // Check for duplicate
  const duplicate = await AcademicYear.findOne({ title }).lean().exec();

  // Allow updates to the original academicYear
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate academic Year found" });
  }

  academicYear.title = title; //it will only allow updating properties that are already existant in the model
  academicYear.yearStart = yearStart;
  academicYear.yearEnd = yearEnd;

  academicYear.academicYearCreator = academicYearCreator;

  const updatedAcademicYear = await academicYear.save(); //save method received when we did not include lean

  res.json({ message: `Academic year ${updatedAcademicYear.academicYearname} updated` });
});
//--------------------------------------------------------------------------------------1
// @desc Delete a academicYear
// @route DELETE '/settings/academicsSet/academicYears/'
// @access Private
const deleteAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required id not found" });
  }

  // Does the academicYear still have assigned notes?
  // const note = await Note.findOne({ academicYear: id }).lean().exec()
  // if (note) {
  //     return res.status(400).json({ message: 'AcademicYear has assigned notes' })
  // }

  // Does the academicYear exist to delete?
  const academicYear = await AcademicYear.findById(id).exec();

  if (!academicYear) {
    return res.status(400).json({ message: "Academic Year not provided" });
  }

  const result = await academicYear.deleteOne();
//console.log(result, 'result')
  const reply = `Deleted ${result.deletedCount} AcademicYear ${academicYear.title} `;

  res.json(reply);
});

module.exports = {
  getAllAcademicYears,
  createNewAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
};
