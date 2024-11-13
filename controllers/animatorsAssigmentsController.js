// const User = require('../models/User')
const AnimatorsAssigment = require("../models/AnimatorsAssignment");
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all animatorsAssigment
// @route GET 'desk/animatorsAssigment
// @access Private // later we will establish authorisations
const getAllAnimatorsAssigments = asyncHandler(async (req, res) => {
  // console.log('helloooooooo')
  // Check if an ID is passed as a query parameter
  if (req.query.id) {
    const { id } = req.query;

    // Find a single attended school by its ID
    const animatorsAssigment = await AnimatorsAssigment.findOne({
      _id: id,
    }).lean();

    if (!animatorsAssigment) {
      return res.status(404).json({ message: "Attended School not found" });
    }

    return res.json(animatorsAssigment);
  }

  // If no ID is provided, fetch all attended schools
  const animatorsAssigments = await AnimatorsAssigment.find().lean();

  if (!animatorsAssigments.length) {
    return res.status(404).json({ message: "No attended schools found" });
  }

  res.json(animatorsAssigments);
});

// // @desc getAnimatorsAssigmentByUSerId
// // @route GET 'desk/animatorsAssigment/myAnimatorsAssigment with userID passed in the body of the query
// // @access Private // later we will establish authorisations
// const getAnimatorsAssigmentByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const animatorsAssigment = await AnimatorsAssigment.find().lean()//this will not return the extra data(lean)

//     // If no students
//     if (!animatorsAssigment?.length) {
//         return res.status(400).json({ message: 'No animatorsAssigments found from animatorsAssigment controller with love' })
//     }
//     res.json(animatorsAssigment)
// })

//----------------------------------------------------------------------------------
// @desc Create new animatorsAssigment
// @route POST 'desk/animatorsAssigment
// @access Private
const createNewAnimatorsAssigment = asyncHandler(async (req, res) => {
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
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await AnimatorsAssigment.findOne({
    assignmentYear,
    assignedFrom,
    assignedTo,
  })
    .lean()
    .exec(); //because we re receiving only one response from mongoose

  if (duplicate && duplicate.assignments == assignments) {
    return res.status(409).json({
      message: `Duplicate animatorsAssigment: ${duplicate.assignedFrom} - ${duplicate.assignedTo}, found`,
    });
  }

  const animatorsAssigmentObject = {
    assignmentYear,
    assignments,
    assignedFrom,
    assignedTo,
    creator,
    operator,
  }; //construct new animatorsAssigment to be stored

  // Create and store new animatorsAssigment
  const animatorsAssigment = await AnimatorsAssigment.create(
    animatorsAssigmentObject
  );

  if (animatorsAssigment) {
    //if created
    res.status(201).json({
      message: `New animatorsAssigment of subject: ${animatorsAssigment.assignedFrom} - ${animatorsAssigment.assignedTo}, created`,
    });
  } else {
    res
      .status(400)
      .json({ message: "Invalid animatorsAssigment data received" });
  }
});

// @desc Update a animatorsAssigment
// @route PATCH 'desk/animatorsAssigment
// @access Private
const updateAnimatorsAssigment = asyncHandler(async (req, res) => {
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
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }
  // Does the animatorsAssigment exist to update?
  const animatorsAssigment = await AnimatorsAssigment.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!animatorsAssigment) {
    return res.status(400).json({ message: "AnimatorsAssigment not found" });
  }

  animatorsAssigment.assignmentYear = assignmentYear; //it will only allow updating properties that are already existant in the model
  animatorsAssigment.assignments = assignments;
  animatorsAssigment.assignedFrom = assignedFrom;
  animatorsAssigment.assignedTo = assignedTo;
  animatorsAssigment.operator = operator;

  const updatedAnimatorsAssigment = await animatorsAssigment.save(); //save method received when we did not include lean

  res.json({
    message: `animatorsAssigment: ${updatedAnimatorsAssigment.assignedFrom} -  ${updatedAnimatorsAssigment.assignedTo}, updated`,
  });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteAnimatorsAssigment = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "AnimatorsAssigment ID Required" });
  }

  // Does the user exist to delete?
  const animatorsAssigment = await AnimatorsAssigment.findById(id).exec();

  if (!animatorsAssigment) {
    return res.status(400).json({ message: "AnimatorsAssigment not found" });
  }

  const result = await animatorsAssigment.deleteOne();

  const reply = `animatorsAssigment ${animatorsAssigment.animatorsAssigmentubject}, with ID ${animatorsAssigment._id}, deleted`;

  res.json(reply);
});

module.exports = {
  getAllAnimatorsAssigments,
  createNewAnimatorsAssigment,
  updateAnimatorsAssigment,
  deleteAnimatorsAssigment,
};
