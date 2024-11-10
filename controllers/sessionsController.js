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
  
    if (criteria === "schools" && selectedYear ) {
      console.log(selectedYear,'selected year we re here at schools')
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
        sessionSectionId: session.section._id,// this generated anerror at some popint because of wrong session data manually generated
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
          (session) => session?.animator?.toString() === id
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
    if (criteria === "animators" && selectedYear) {
      console.log("code for populating animators");
    }
    if (criteria === "services" && selectedYear) {
      console.log("code for populating services");
    }
 

  //if no creteria  or selectedYear is passed
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
  // console.log(
  //   sessionType,
  //   sessionYear,
  //   school,
  //   Subject,
  //   StartTime,
  //   EndTime,
  //   student,
  //   operator,
  //   classroom,
  //   animator,
  //   Description,
  //   RecurrenceRule,
  //   RecurrenceException,
  //   RecurrenceID,
  //   FollowingID,
  //   IsAllDay,
  //   IsBlock,
  //   IsReadOnly
  // );
  if (
    !sessionType ||
    !sessionYear ||
    !school ||
    !Subject ||
    !StartTime ||
    !EndTime ||
    !student ||
    !operator 
    //|| 
    // (school === "6714e7abe2df335eecd87750" && !animator) ||
    // (school === "6714e7abe2df335eecd87750" && !classroom)// removed because the animator and classroom will come from section itself
  )
   {
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

  // //will set isblock if the subject is lunch
  // if (sessionObject.Subject==="Lunch1" || sessionObject.Subject==="Lunch2"){
  //   sessionObject.IsBlock=true
  // }
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
  console.log(req.body);
  const {
    id,
    extraException,
    sessionType,
    sessionYear,
    animator,
    student,
    sessionStudentId,
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
    color,
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
    case "editSession": //after updating a single event NOT in series but can give way to series also
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
      session.RecurrenceRule = RecurrenceRule;
      //session.RecurrenceID = RecurrenceID;
      //session.FollowingID = FollowingID;
      //session.RecurrenceException = RecurrenceException;

  //      //will set isblock if the subject is lunch
  // if (session.Subject==="Lunch1" || session.Subject==="Lunch2"){
  //   session.IsBlock=true
  // }

      const updatedSessionNotInSeries = await session.save(); //save method received when we did not include lean

      return res.json({
        message: `session: ${updatedSessionNotInSeries.StartTime} - ${updatedSessionNotInSeries.EndTime}, updated`,
      });
    case "editOccurence": //after updating a single event IN series
      console.log("we are hererrrrrrrrrrrrrre");
      //update Parent with exception
      if (!session.RecurrenceException) {
        session.RecurrenceException = extraException; // If empty, start with the new exception
      } else {
        const exceptionsArray = session.RecurrenceException.split(",");

        // Check if extraException is already present in the array
        if (!exceptionsArray.includes(extraException)) {
          session.RecurrenceException = `${session.RecurrenceException},${extraException}`;
        }
      }

      //crete new child session

      const newChildSession = {
        animator: animator,
        sessionYear: sessionYear,
        Description: Description,
        Subject: Subject,
        EndTime: EndTime,
        StartTime: StartTime,
        IsAllDay: IsAllDay,
        IsBlock: IsBlock,
        operator: operator,
        student: sessionStudentId || student._id,
        RecurrenceID: RecurrenceID !== "" ? RecurrenceID : id, //RecurrenceID already set to parent Id earin front end
        FollowingID: FollowingID,
        school: school,
        classroom: classroom,
        IsReadOnly: IsReadOnly,
        sessionType: sessionType,
      };

      //session.RecurrenceException = RecurrenceException;

      //now  save the parent
      const updatedMasterSessionInSeries = await session.save(); //save method received when we did not include lean
      //save the new child
      const newChildSessionInSeries = await Session.create(newChildSession);

      if (newChildSessionInSeries && updatedMasterSessionInSeries) {
        return res.status(201).json({
          message: `master session: ${updatedMasterSessionInSeries.StartTime} - ${updatedMasterSessionInSeries.EndTime} created, and session${newChildSessionInSeries.StartTime}-${newChildSessionInSeries.EndTime} updated`,
        });
      } else {
        return res.status(400).json({
          message:
            "Invalid session data received, update was not or partially done",
        });
      }

    case "editSeries": // in case we add editing of the whole series evetn altered events, we will update them,
      // we choose to remove teh occurences recurrencIDs and remove any exception in the master, the user will manually remove any double occurence,

      // check if the startTime has
      session.animator = animator;
      session.Description = Description;
      session.Subject = Subject;
      session.EndTime = EndTime;
      session.StartTime = StartTime;
      session.IsAllDay = IsAllDay;
      session.IsBlock = IsBlock;
      session.RecurrenceRule = RecurrenceRule;
      session.RecurrenceException = "";

      session.student = student || sessionStudentId;
      //session.RecurrenceID = RecurrenceID;// should not be saved becasue we are editing the master event
      session.FollowingID = FollowingID;
      session.school = school;
      session.classroom = classroom;
      session.IsReadOnly = IsReadOnly;
      session.sessionType = sessionType;

      const updatedMasterSession = await session.save(); //save method received when we did not include lean
      if (!updatedMasterSession)
        return res.status(400).json({
          message: "unable to update master session",
        });
      ///find all sessions with RecurrenceID===id to remove it

      // Find all sessions with the given RecurrenceID
      const sessions = await Session.find({ RecurrenceID: id });

      // Update each session to set RecurrenceID to an empty string
      if (sessions) {
        await Session.updateMany(
          { RecurrenceID: id },
          { $set: { RecurrenceID: "" } }
        );
        return res.json({
          message: `master session: ${updatedMasterSession.StartTime} - ${updatedMasterSession.EndTime}, and ${sessions.length} sessions updated`,
        });
      } else {
        return res.status(400).json({
          message: "unable to update occurences",
        });
      }
  }
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteSession = asyncHandler(async (req, res) => {
  const { id, operationType, extraException } = req.body;
  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Session ID Required" });
  }
  // Does the user exist to delete?
  const session = await Session.findById(id).exec();
  if (!session) {
    return res.status(400).json({ message: "Session not found" });
  }

  switch (operationType) {
    case "deleteSession": //delete single separate event
      const ressul = await session.deleteOne();
      res.json({
        message: `deleted  ${ressul.deletedCount} session ${session.StartTime} - ${session.EndTime}, deleted`,
      });
      break;

    case "deleteOccurence": //after deletion of single event in series
      //console.log(extraException, id);
      if (!session.RecurrenceException) {
        session.RecurrenceException = extraException; // If empty, start with the new exception
      } else {
        const exceptionsArray = session.RecurrenceException.split(",");

        // Check if extraException is already present in the array
        if (!exceptionsArray.includes(extraException)) {
          session.RecurrenceException = `${session.RecurrenceException},${extraException}`;
        }
      }
      const updatedRecurrenceExceptionSession = await session.save(); //save method received when we did not include lean

      res.json({
        message: `occurence ${extraException} for Master session: ${session.StartTime} - ${session.EndTime}, deleted`,
      });
      break;

    //const reply = `session ${session.StartTime} - ${session.EndTime}, deleted`;
    case "deleteSeries": //delete all series even those that have been edited
      const res1 = await session.deleteOne();
      const result = await Session.deleteMany({ RecurrenceID: id });
      res.json({
        message: `Deleted ${res1.deletedCount} session with ID: ${id} and ${result.deletedCount} additional related sessions in the series `,
      });
      break;
  }
});

module.exports = {
  getAllSessions,
  createNewSession,
  updateSession,
  deleteSession,
};
