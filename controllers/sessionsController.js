// const User = require('../models/User')
const Session = require("../models/Session");
const Section = require("../models/Section");
const AttendedSchool = require("../models/AttendedSchool");
const Classroom = require("../models/Classroom");
const User = require("../models/User");
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// Define an asynchronous function to process sessions
const addEmployeeNamesToSessions = async (flattenedSessions) => {
  const updatedSessions = await Promise.all(
    flattenedSessions.map(async (session) => {
      // Find the user with the matching employeeId
      const user = await User.findOne({ employeeId: session.animator });

      // If user is found, combine first and last names into employeeFullName
      const employeeFullName = user
        ? `${user.userFullName.userFirstName} ${user.userFullName.userLastName}`
        : "Unknown";

      // Return the updated session with the new employeeFullName field
      return { ...session, employeeFullName };
    })
  );

  return updatedSessions;
};

// @desc Get all session
// @route GET 'desk/session
// @access Private // later we will establish authorisations
const getAllSessions = asyncHandler(async (req, res) => {
  const { criteria, selectedYear, id } = req.query;

  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  // if (id) {
  //   const { id } = req.query;

  //   // Find a single session by its ID
  //   const session = await Session.findOne({ _id: id })
  //     .populate("school")
  //     .populate("classroom")
  //     .lean();

  //   if (!session) {
  //     return res.status(404).json({ message: "Session not found" });
  //   }

  //   return res.json(session);
  // }
  if (selectedYear && criteria) {
    if (criteria === "schools") {
      //console.log(selectedYear,'selected year we re here at schools')
      //we nneed the scheduler grouoed by schools
      // If no ID is provided, fetch all sessions
      const sessions = await Session.find({ sessionYear: selectedYear })
        .populate("school")
        .populate("classroom")
        .populate(
          "student",
          "-studentDob -studentSex -studentEducation -studentYears -studentGardien -operator -updatedAt"
        )
        .populate(
          "animator",
          "-employeeAssessment -employeeCurrentEmployment -employeeIsActive -employeeWorkHistory -employeeYears "
        )
        .lean();

      if (!sessions.length) {
        return res.status(404).json({ message: "No sessions found" });
      }
      //console.log(sessions, "sessions");
      const formattedSessions = sessions.map((session) => {
        if (session.classroom) {
          session.Location = session?.classroom?.classroomLabel;
          session.site = session?.school;
        } else {
          session.Location = session.school.schoolName;
          session.color = session.school.schoolColor;
          session.site = session?.school;
        }
        //console.log(session)
        return session;
      });

      // add each of the sections to the session, first retrive all sections for that year and with no ending date (current)
      const sections = await Section.find({
        $and: [
          { sectionYear: selectedYear }, // Match sectionYear with selectedYear
          { $or: [{ endDate: { $exists: false } }, { endDate: null }] }, // Either endDate does not exist or it's null
        ],
      })
        .select("-sectionType -operator -sectionYear -sectionLocation")
        .lean();
      //console.log(sections,'sections')

      if (!sections) {
        return res.status(404).json({ message: "No sections found" });
      }
      //populate the section for every session!!!!!!!!!!!!!!!we need to only keep the dates we need for the section currency, we only use the last version section

      formattedSessions.forEach((session) => {
        // Find the section where the student's _id is in the section's students array
        const matchingSection = sections.find((section) =>
          section.students.some(
            (student) => student.toString() === session.student._id.toString()
          )
        );

        // Add the matching section to the session object as a new attribute
        if (matchingSection) {
          session.section = matchingSection;
        }
      });
      //console.log(formattedSessions)

      //flatten some of the data ot be used in the schefuler

      const flattenedSessions = formattedSessions.map((session) => ({
        ...session,
        sessionSectionId: session.section._id,
        sessionStudentId: session.student._id,
        sectionName: session.section.name,
        studentName: session.student.name,
        employeeColor: session?.animator?.employeeColor,
        animator: session.animator?._id,
        classroomColor: session?.classroom?.classroomColor,
        classroomLabel: session?.classroom?.classroomLabel,
        classroomNumber: session?.classroom?.classroomNumber,
        classroom: session?.classroom?._id,
      }));
      //add user fullname for the employee

      const updatedSessions = await addEmployeeNamesToSessions(
        flattenedSessions
      );

      //if we need only sessions for an animator
      if (id) {
        // if the query conatains id

        //console.log(updatedSessions[3].animator, id, 'updatedSessionsssssssssssssssss')
        const sessionsForAnimator = updatedSessions.filter(
          (session) => session.animator.toString() === id
        );
        //console.log(sessionsForAnimator, 'sessionsForAnimatorrrrrrrrrrrr')
        if (sessionsForAnimator.length === 0) {
          return res
            .status(404)
            .json({ message: "No sessions found for that animator" });
        }
        return res.json(sessionsForAnimator);
      }

      return res.json(updatedSessions);
    }
    if (criteria === "animators") {
      console.log("code for populating animators");
    }
    if (criteria === "services") {
      console.log("code for populating services");
    }
  }

  //if no creteria is passed
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
      session.Location = session?.classroom?.classroomLabel;
      session.site = session?.school;
    } else {
      session.Location = session.school.schoolName;
      session.color = session.school.schoolColor;
      session.site = session?.school;
    }
    //console.log(session)
    return session;
  });
  return res.json(formattedSessions);
});

//----------------------------------------------------------------------------------
// @desc Create new session
// @route POST 'desk/session
// @access Private
const createNewSession = asyncHandler(async (req, res) => {
  const {
    sessionType,
    sessionYear,
    school,
    Subject,
    classroom,
    animator,
    Description,
    EndTime,
    StartTime,
    RecurrenceRule,
    RecurrenceException,
    student,
    RecurrenceID,
    FollowingID,
    IsAllDay,
    IsBlock,
    IsReadOnly,
    operator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields
  console.log(
    sessionType,
    sessionYear,
    school,
    Subject,
    StartTime,
    EndTime,
    student,
    operator,
    classroom,
    animator,
    Description,
    RecurrenceRule,
    RecurrenceException,
    RecurrenceID,
    FollowingID,
    IsAllDay,
    IsBlock,
    IsReadOnly
  );
  if (
    !sessionType ||
    !sessionYear ||
    !school ||
    !Subject ||
    !StartTime ||
    !EndTime ||
    !student ||
    !operator ||
    (school === "6714e7abe2df335eecd87750" && !animator) ||
    (school === "6714e7abe2df335eecd87750" && !classroom)
  ) {
    //if nursery and no animator or no classroom
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await Session.findOne({
    school,
    sessionType,
    student,
    StartTime,
    EndTime,
  })
    .lean()
    .exec(); //because we re receiving only one response from mongoose

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate session on: ${duplicate.StartTime} - ${duplicate.EndTime}, found`,
    });
  }

  const sessionObject = {
    sessionType,
    sessionYear,
    school,
    Subject,
    classroom,
    animator,
    Description,
    EndTime,
    StartTime,
    RecurrenceRule,
    RecurrenceException,
    student,
    RecurrenceID,
    FollowingID,
    IsAllDay,
    IsBlock,
    IsReadOnly,
    operator,
    creator: operator,
  }; //construct new session to be stored

  // Create and store new session
  const session = await Session.create(sessionObject);

  if (session) {
    //if created
    // if (session.recurrenceRule !== "") {
    //   session.recurrenceID = session._id;
    //   const recurrentSession = await Session.create(session);
    //   return res.status(201).json({
    //     message: `New session  on: ${recurrentSession.startTime} - ${recurrentSession.endTime}, created`,
    //   });
    // }
    return res.status(201).json({
      message: `New session  on: ${session.StartTime} - ${session.EndTime}, created`,
    });
  } else {
    res.status(400).json({ message: "Invalid session data received" });
  }
});

// @desc Update a session
// @route PATCH 'desk/session
// @access Private
const updateSession = asyncHandler(async (req, res) => {
  console.log(req.body)
  const {
    id,
    extraException,
    sessionType,
    sessionYear,
    animator,
    student,
    Description,
    Subject,
    StartTime,
    EndTime,
    school,
    classroom,
    RecurrenceRule,
    RecurrenceID,
    FollowingID,
    RecurrenceException,
    IsAllDay,
    IsBlock,
    IsReadOnly,
    operator,

    operationType,
  } = req?.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "All mandatory fields required" });
  }

  // Does the session exist to update?
  const session = await Session.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!session) {
    return res.status(400).json({ message: "Session to update not found" });
  }

  switch (operationType) {
    case "addParentWithExtraRecurrenceException": //after deletion of single event in series
      console.log(extraException, id);
      if (!session.RecurrenceException) {
        session.RecurrenceException = extraException; // If empty, start with the new exception
      } else {
        session.RecurrenceException = `${session.RecurrenceException},${extraException}`;
      }

      const updatedRecurrenceExceptionSession = await session.save(); //save method received when we did not include lean

      return res.json({
        message: `session: ${updatedRecurrenceExceptionSession.StartTime} - ${updatedExceptionSession.EndTime}, updated`,
      });

    case "updateSingleEventNotInSeries": //after updating a single event NOT in series
    console.log('we are hererrrrrrrrrrrrrre')

      session.sessionType = sessionType;
      session.sessionYear = sessionYear;
      session.animator = animator;
      session.student = student;
      session.Description = Description;
      session.Subject = Subject;
      session.StartTime = StartTime;
      session.EndTime = EndTime;
      session.school = school;
      session.classroom = classroom;
      session.IsAllDay = IsAllDay;
      session.IsBlock = IsBlock;
      session.IsReadOnly = IsReadOnly;
      session.operator = operator;
      //session.RecurrenceID = RecurrenceID;
      //session.FollowingID = FollowingID;
      //session.RecurrenceRule = RecurrenceRule;
      //session.RecurrenceException = RecurrenceException;

      const updatedSessionNotInSeries = await session.save(); //save method received when we did not include lean

      return res.json({
        message: `session: ${updatedSessionNotInSeries.StartTime} - ${updatedSessionNotInSeries.EndTime}, updated`,
      });
    case "updateSingleEventInSeries": //after updating a single event IN series
      session.animator = animator;
      session.Description = Description;
      session.Subject = Subject;
      session.EndTime = EndTime;
      session.StartTime = StartTime;
      session.IsAllDay = IsAllDay;
      session.IsBlock = IsBlock;
      session.RecurrenceRule = RecurrenceRule;
      session.RecurrenceException = RecurrenceException;
      session.sessionStudentId = sessionStudentId;
      session.student = student;
      session.RecurrenceID = RecurrenceID;
      session.FollowingID = FollowingID;
      session.school = school;
      session.classroom = classroom;
      session.IsReadOnly = IsReadOnly;
      session.sessionType = sessionType;

      const updatedSessionInSeries = await session.save(); //save method received when we did not include lean
      //now update the master session with the exception
      const masterSession = Session.findOne({ _id: id });
      if (!session.RecurrenceException) {
        session.RecurrenceException = extraException; // If empty, start with the new exception
      } else {
        session.RecurrenceException = `${session.RecurrenceException},${extraException}`;
      }

      const updatedRecurrenceExceptionMasterSession = await session.save(); //save method received when we did not include lean

      return res.json({
        message: `session: ${updatedSessionInSeries.StartTime} - ${updatedSessionInSeries.EndTime}, and Master${updatedRecurrenceExceptionMasterSession.StartTime}-${updatedRecurrenceExceptionMasterSession.EndTime} updated`,
      });
    case "updateEntireSeries":
      session.animator = animator;
      session.Description = Description;
      session.Subject = Subject;
      session.EndTime = EndTime;
      session.StartTime = StartTime;
      session.IsAllDay = IsAllDay;
      session.IsBlock = IsBlock;
      session.RecurrenceRule = RecurrenceRule;
      //session.RecurrenceException = RecurrenceException;
      session.sessionStudentId = sessionStudentId;
      session.student = student;
      session.RecurrenceID = RecurrenceID;
      session.FollowingID = FollowingID;
      session.school = school;
      session.classroom = classroom;
      session.IsReadOnly = IsReadOnly;
      session.sessionType = sessionType;

      const updatedSessionsSeries = await session.save(); //save method received when we did not include lean

      return res.json({
        message: `session: ${updatedSessionsSeries.StartTime} - ${updatedSessionsSeries.EndTime}, updated`,
      });
  }
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteSession = asyncHandler(async (req, res) => {
  const { id, operationType } = req.body;
  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Session ID Required" });
  }
  // Does the user exist to delete?
  const session = await Session.findById(id).exec();
  if (!session) {
    return res.status(400).json({ message: "Session not found" });
  }
  await session.deleteOne();
  //const reply = `session ${session.StartTime} - ${session.EndTime}, deleted`;
  if (operationType && operationType === "deleteWholeSeries") {
    const result = await Session.deleteMany({ RecurrenceID: id });
    return res.json({
      message: `Deleted session with ID: ${id} and ${result.deletedCount} additional related sessions in the series `,
    });
  }
});

module.exports = {
  getAllSessions,
  createNewSession,
  updateSession,
  deleteSession,
};
