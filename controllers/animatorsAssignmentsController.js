 const User = require('../models/User')
const AnimatorsAssignment = require("../models/AnimatorsAssignment");
 const Employee = require("../models/Employee");
 const AttendedSchool = require("../models/AttendedSchool");

const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all animatorsAssignment
// @route GET 'desk/animatorsAssignment
// @access Private // later we will establish authorisations
const getAllAnimatorsAssignments = asyncHandler(async (req, res) => {
  // console.log('helloooooooo')
  const { id, selectedYear } = req.query;

  if (selectedYear) {
    // Find a single assignment by its ID
    

    // Manually associate userFullName with each animator in assignments
    
    const animatorsAssignments = await AnimatorsAssignment.find({assignmentYear: selectedYear})
    .populate({path:'assignments.schools', select:'_id, schoolName'})
    
    .lean(); // Convert Mongoose documents to plain JavaScript objects
  
  

    if (!animatorsAssignments) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.json(animatorsAssignments);
  }
  if (id) {
    // Find a single assignment by its ID
    const animatorsAssignment = await AnimatorsAssignment.findOne({
      _id: id,
    }).lean();

    if (!animatorsAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.json(animatorsAssignment);
  }
  // If no ID is provided, fetch all assignments
  const animatorsAssignments = await AnimatorsAssignment.find().lean();

  if (!animatorsAssignments.length) {
    return res.status(404).json({ message: "No assignment found" });
  }

  res.json(animatorsAssignments);
});

// // @desc getAnimatorsAssignmentByUSerId
// // @route GET 'desk/animatorsAssignment/myAnimatorsAssignment with userID passed in the body of the query
// // @access Private // later we will establish authorisations
// const getAnimatorsAssignmentByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const animatorsAssignment = await AnimatorsAssignment.find().lean()//this will not return the extra data(lean)

//     // If no students
//     if (!animatorsAssignment?.length) {
//         return res.status(400).json({ message: 'No animatorsAssignments found from animatorsAssignment controller with love' })
//     }
//     res.json(animatorsAssignment)
// })

//----------------------------------------------------------------------------------
// @desc Create new animatorsAssignment
// @route POST 'desk/animatorsAssignment
// @access Private
const createNewAnimatorsAssignment = asyncHandler(async (req, res) => {
  const {
    assignmentYear,
    assignments,
    assignedFrom,
    assignedTo,
    creator,
    operator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !assignmentYear ||
    !assignments ||
    assignments.length < 1 ||
    !assignedFrom ||
    !assignedTo ||
    !creator ||
    !operator
  ) {
    return res.status(400).json({ message: "Required fields are missing" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await AnimatorsAssignment.findOne({
    assignmentYear,
    assignedFrom,
    assignedTo,
  })
    .lean()
    .exec(); //because we re receiving only one response from mongoose

  if (duplicate && duplicate.assignments == assignments) {
    return res.status(409).json({
      message: `Duplicate animatorsAssignment: ${duplicate.assignedFrom} - ${duplicate.assignedTo}, found`,
    });
  }

  const animatorsAssignmentObject = {
    assignmentYear,
    assignments,
    assignedFrom,
    assignedTo,
    creator,
    operator,
  }; //construct new animatorsAssignment to be stored

  // Create and store new animatorsAssignment
  const animatorsAssignment = await AnimatorsAssignment.create(
    animatorsAssignmentObject
  );

  if (animatorsAssignment) {
    //if created
    res.status(201).json({
      message: `New animatorsAssignment of subject: ${animatorsAssignment.assignedFrom} - ${animatorsAssignment.assignedTo}, created`,
    });
  } else {
    res
      .status(400)
      .json({ message: "Invalid animatorsAssignment data received" });
  }
});

// @desc Update a animatorsAssignment
// @route PATCH 'desk/animatorsAssignment
// @access Private
const updateAnimatorsAssignment = asyncHandler(async (req, res) => {
  const {
    id,
    assignmentYear,
    assignments,
    assignedFrom,
    assignedTo,
    operator,
  } = req?.body;

  // Confirm data
  if (
    !id ||
    !assignmentYear ||
    !assignments ||
    assignments.length < 1 ||
    !assignedFrom ||
    !assignedTo ||
    !operator
  ) {
    return res.status(400).json({ message: "Required fields are missing" }); //400 : bad request
  }
  // Does the animatorsAssignment exist to update?
  const animatorsAssignment = await AnimatorsAssignment.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!animatorsAssignment) {
    return res.status(400).json({ message: "AnimatorsAssignment not found" });
  }

  animatorsAssignment.assignmentYear = assignmentYear; //it will only allow updating properties that are already existant in the model
  animatorsAssignment.assignments = assignments;
  animatorsAssignment.assignedFrom = assignedFrom;
  animatorsAssignment.assignedTo = assignedTo;
  animatorsAssignment.operator = operator;

  const updatedAnimatorsAssignment = await animatorsAssignment.save(); //save method received when we did not include lean

  res.json({
    message: `animatorsAssignment: ${updatedAnimatorsAssignment.assignedFrom} -  ${updatedAnimatorsAssignment.assignedTo}, updated`,
  });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteAnimatorsAssignment = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "AnimatorsAssignment ID Required" });
  }

  // Does the user exist to delete?
  const animatorsAssignment = await AnimatorsAssignment.findById(id).exec();

  if (!animatorsAssignment) {
    return res.status(400).json({ message: "AnimatorsAssignment not found" });
  }

  const result = await animatorsAssignment.deleteOne();

  const reply = `animatorsAssignment ${animatorsAssignment.animatorsAssignmentubject}, with ID ${animatorsAssignment._id}, deleted`;

  res.json(reply);
});

module.exports = {
  getAllAnimatorsAssignments,
  createNewAnimatorsAssignment,
  updateAnimatorsAssignment,
  deleteAnimatorsAssignment,
};
