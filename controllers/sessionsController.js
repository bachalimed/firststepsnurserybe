// const User = require('../models/User')
const Session = require("../models/Session");
const AttendedSchool = require("../models/AttendedSchool");
const Classroom = require("../models/Classroom");
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all session
// @route GET 'desk/session
// @access Private // later we will establish authorisations
const getAllSessions = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  if (req.query.id) {
    const { id } = req.query;

    // Find a single session by its ID
    const session = await Session.findOne({ _id: id })
      .populate("school")
      .populate("classroom")
      .lean();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json(session);
  }

  // If no ID is provided, fetch all sessions
  const sessions = await Session.find()
    .populate("school")
    .populate("classroom")
    .lean();

  if (!sessions.length) {
    return res.status(404).json({ message: "No sessions found" });
  }
  //console.log(sessions, "sessions");
  const formattedSessions = sessions.map((session) => {
    if (session.classroom) {
      session.location = session?.classroom?.classroomLabel;
      session.site = session?.school
    } else  {
      session.location = session.school.schoolName;
      session.color = session.school.schoolColor;
      session.site = session?.school
    }
    //console.log(session)
    return session
  });

  res.json(formattedSessions);
});

//----------------------------------------------------------------------------------
// @desc Create new session
// @route POST 'desk/session
// @access Private
const createNewSession = asyncHandler(async (req, res) => {
  const { schoolName, schoolCity, schoolType } = req?.body; //this will come from front end we put all the fields o fthe collection here
  console.log(schoolName, schoolCity, schoolType);
  //Confirm data is present in the request with all required fields

  if (!schoolName || !schoolCity || !schoolType) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await Session.findOne({ schoolName }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicate && duplicate.schoolType == schoolType) {
    return res
      .status(409)
      .json({ message: `Duplicate session: ${duplicate.schoolName}, found` });
  }

  const sessionObject = { schoolName, schoolCity, schoolType }; //construct new session to be stored

  // Create and store new session
  const session = await Session.create(sessionObject);

  if (session) {
    //if created
    res.status(201).json({
      message: `New session of subject: ${session.schoolName}, created`,
    });
  } else {
    res.status(400).json({ message: "Invalid session data received" });
  }
});

// @desc Update a session
// @route PATCH 'desk/session
// @access Private
const updateSession = asyncHandler(async (req, res) => {
  const { id, schoolName, schoolCity, schoolType } = req?.body;

  // Confirm data
  if (!id || !schoolName || !schoolCity || !schoolType) {
    return res.status(400).json({ message: "All mandatory fields required" });
  }

  // Does the session exist to update?
  const session = await Session.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!session) {
    return res.status(400).json({ message: "Session not found" });
  }

  session.schoolName = schoolName; //it will only allow updating properties that are already existant in the model
  session.schoolCity = schoolCity;
  session.schoolType = schoolType;

  const updatedSession = await session.save(); //save method received when we did not include lean

  res.json({ message: `session: ${updatedSession.schoolName}, updated` });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Session ID Required" });
  }

  // Does the user exist to delete?
  const session = await Session.findById(id).exec();

  if (!session) {
    return res.status(400).json({ message: "Session not found" });
  }

  const result = await session.deleteOne();

  const reply = `session ${session.sessionubject}, with ID ${session._id}, deleted`;

  res.json(reply);
});

module.exports = {
  getAllSessions,
  createNewSession,
  updateSession,
  deleteSession,
};
