// const User = require('../models/User')
const Section = require("../models/Section");
const Student = require("../models/Student");
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all section
// @route GET 'desk/section
// @access Private // later we will establish authorisations
const getAllSections = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;
  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

    // Find a single section by its ID
    const section = await Section.findOne({ _id: id })
      .populate("students", "-operator -studentDob -studentGardien -updatedAt")
      .lean();

    if (!section) {
      return res.status(400).json({ message: "Section not found" });
    }

    // Return the section inside an array
    return res.json([section]); //we need it inside  an array to avoid response data error
  }
  //for nursery sections, we need animators with the data
  if (selectedYear !== "1000" && criteria === "withAnimators") {
    //console.log(
    // "we re heeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeere"
    // );
    try {
      const sections = await Section.aggregate([
        { $match: { sectionYear: selectedYear } }, // Match sections by sectionYear

        // Lookup for Classroom details
        {
          $lookup: {
            from: "classrooms",
            localField: "sectionLocation",
            foreignField: "_id",
            as: "classroomDetails",
          },
        },
        {
          $unwind: {
            path: "$classroomDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Unwind students array and lookup for Student details
        { $unwind: "$students" },
        {
          $lookup: {
            from: "students",
            localField: "students",
            foreignField: "_id",
            as: "studentDetails",
          },
        },
        {
          $unwind: {
            path: "$studentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Filter studentEducation by selectedYear
        {
          $addFields: {
            "studentDetails.studentEducation": {
              $filter: {
                input: "$studentDetails.studentEducation",
                as: "education",
                cond: { $eq: ["$$education.schoolYear", selectedYear] },
              },
            },
          },
        },
        {
          $unwind: {
            path: "$studentDetails.studentEducation",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Lookup for attended school details
        {
          $lookup: {
            from: "attendedSchools",
            localField: "studentDetails.studentEducation.attendedSchool",
            foreignField: "_id",
            as: "attendedSchoolDetails",
          },
        },
        {
          $unwind: {
            path: "$attendedSchoolDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Lookup for Employee details
        {
          $lookup: {
            from: "employees",
            localField: "sectionAnimator",
            foreignField: "_id",
            as: "animatorDetails",
          },
        },
        {
          $unwind: {
            path: "$animatorDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Lookup from Users collection where employeeId in Users matches _id in Employees
        {
          $lookup: {
            from: "users",
            localField: "animatorDetails._id", // employee's _id
            foreignField: "employeeId", // user employeeId field
            as: "animatorUserDetails",
          },
        },
        {
          $unwind: {
            path: "$animatorUserDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Projecting the required fields
        {
          $project: {
            _id: 1,
            sectionType: 1,
            sectionColor: 1,
            sectionLabel: 1,
            sectionFrom: 1,
            sectionTo: 1,
            sectionAnimator: {
              employeeIsActive: "$animatorDetails.employeeIsActive",
              employeeYears: "$animatorDetails.employeeYears",
              userFullName: "$animatorUserDetails.userFullName",
              userIsActive: "$animatorUserDetails.userIsActive",
              userRoles: "$animatorUserDetails.userRoles",
            },
            sectionYear: 1,
            sectionLocation: "$classroomDetails",
            studentDetails: {
              studentName: "$studentDetails.studentName",
              studentIsActive: "$studentDetails.studentIsActive",
              studentSex: "$studentDetails.studentSex",
              studentYears: {
                $arrayElemAt: ["$studentDetails.studentYears", 0],
              },
              studentEducation: {
                $cond: {
                  if: { $ne: ["$studentDetails.studentEducation", []] },
                  then: {
                    schoolYear: "$studentDetails.studentEducation.schoolYear",
                    note: "$studentDetails.studentEducation.note",
                    attendedSchool: {
                      schoolName: "$attendedSchoolDetails.schoolName",
                      schoolCity: "$attendedSchoolDetails.schoolCity",
                      schoolType: "$attendedSchoolDetails.schoolType",
                    },
                  },
                  else: null,
                },
              },
            },
          },
        },

        // Grouping sections and students back into arrays
        {
          $group: {
            _id: "$_id",
            sectionType: { $first: "$sectionType" },
            sectionLabel: { $first: "$sectionLabel" },
            sectionColor: { $first: "$sectionColor" },
            sectionFrom: { $first: "$sectionFrom" },
            sectionTo: { $first: "$sectionTo" },
            sectionAnimator: { $first: "$sectionAnimator" },
            sectionYear: { $first: "$sectionYear" },
            sectionLocation: { $first: "$sectionLocation" },
            students: { $push: "$studentDetails" },
          },
        },
      ]);

      if (!sections.length) {
        return res
          .status(404)
          .json({ message: "No sections found for the selected year" });
      }

      return res.status(200).json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  }
  /////////////////////////////////////////////////////////

  if (selectedYear && selectedYear !== "1000") {
    try {
      // Use aggregate to perform the query
      const sections = await Section.aggregate([
        {
          $match: { sectionYear: selectedYear }, // Match sections by sectionYear
        },
        {
          $lookup: {
            from: "classrooms", // Classroom collection
            localField: "sectionLocation", // Field from Section schema
            foreignField: "_id", // Field from Classroom schema
            as: "classroomDetails", // Populated field
          },
        },
        {
          $unwind: {
            path: "$classroomDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: "$students", // Unwind the students array
        },
        {
          $lookup: {
            from: "students", // Students collection
            localField: "students",
            foreignField: "_id",
            as: "studentDetails",
          },
        },
        {
          $unwind: {
            path: "$studentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Filter studentEducation to only include the selectedYear
        {
          $addFields: {
            "studentDetails.studentEducation": {
              $filter: {
                input: "$studentDetails.studentEducation",
                as: "education",
                cond: { $eq: ["$$education.schoolYear", selectedYear] },
              },
            },
          },
        },
        // Only unwind studentEducation if it has elements (i.e., non-empty)
        {
          $unwind: {
            path: "$studentDetails.studentEducation",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "attendedSchools", // AttendedSchool collection
            localField: "studentDetails.studentEducation.attendedSchool", // Match attendedSchool
            foreignField: "_id",
            as: "attendedSchoolDetails", // Populated attendedSchool details
          },
        },
        {
          $unwind: {
            path: "$attendedSchoolDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            sectionType: 1,
            sectionLabel: 1,
            sectionFrom: 1,
            sectionTo: 1,
            sectionYear: 1,
            sectionLocation: "$classroomDetails", // Include populated Classroom details
            studentDetails: {
              studentName: "$studentDetails.studentName",

              studentIsActive: "$studentDetails.studentIsActive",
              studentSex: "$studentDetails.studentSex",
              _id: "$studentDetails._id",
              studentYears: {
                $arrayElemAt: ["$studentDetails.studentYears", 0], // Directly include studentYears
              },
              studentEducation: {
                $cond: {
                  if: { $ne: ["$studentDetails.studentEducation", []] }, // Only include if non-empty
                  then: {
                    schoolYear: "$studentDetails.studentEducation.schoolYear",
                    note: "$studentDetails.studentEducation.note",
                    attendedSchool: {
                      schoolName: "$attendedSchoolDetails.schoolName",
                      schoolCity: "$attendedSchoolDetails.schoolCity",
                      schoolType: "$attendedSchoolDetails.schoolType",
                    },
                  },
                  else: null, // Set to null if no education
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            sectionType: { $first: "$sectionType" },
            sectionLabel: { $first: "$sectionLabel" },
            sectionFrom: { $first: "$sectionFrom" },
            sectionTo: { $first: "$sectionTo" },
            sectionYear: { $first: "$sectionYear" },
            sectionLocation: { $first: "$sectionLocation" },
            students: { $push: "$studentDetails" }, // Group back the students into an array
          },
        },
      ]);

      // Check if sections were found
      if (!sections.length) {
        return res
          .status(404)
          .json({ message: "No sections found for the selected year" });
      }
      // we already imported the sections and now we will restructure
      //rearrange for the schoolsections
      if (selectedYear && criteria === "forSchoolSections") {
        //rearrange data structure for schoolsectionslist
        // Transform data into the desired structure
        //console.log(sections, "sections");
        let schoolIdCounter = 1; // Initialize a global counter for unique school IDs

        const groupedData = sections.reduce((acc, section) => {
          section.students.forEach((student) => {
            const schoolName =
              student.studentEducation.attendedSchool.schoolName;

            const studentDetails = {
              studentName: student.studentName,
              studentSex: student.studentSex,
              sectionLabel: section.sectionLabel,
              sectionFrom: section.sectionFrom,
              sectionTo: section.sectionTo,
              classroomLabel: section.sectionLocation.classroomLabel,
              classroomNumber: section.sectionLocation.classroomNumber,
            };

            // Check if school already exists in the accumulator
            let schoolEntry = acc.find(
              (school) => school.schoolName === schoolName
            );

            if (!schoolEntry) {
              // If school doesn't exist, create a new entry with a unique _id
              schoolEntry = {
                schoolName,
                _id: schoolIdCounter.toString(), // Assign _id based on the global counter
                students: [],
              };
              acc.push(schoolEntry);
              schoolIdCounter++; // Increment the counter for the next unique school
            }

            // Add student details to the school's students array
            schoolEntry.students.push(studentDetails);
          });

          return acc;
        }, []);

        //console.log(groupedData);
        return res.json(groupedData);
      }

      // if selected Year but no criteria ,Return sections
      return res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      return res
        .status(500)
        .json({ message: "Server error while fetching sections" });
    }
  }
  if (selectedYear && selectedYear === "1000") {
    //standard retreive
    const sections = await Section.find()
      .populate("students", "-operator -studetnDob -studentGardien -updatedAt")
      .lean();

    if (!sections.length) {
      return res.status(404).json({ message: "No sections found" });
    }

    // Map through sections to filter studentYears and studentEducation based on the selectedYear
    const filteredSections = sections.map((section) => {
      // For each section, map through students
      section.students = section.students.map((student) => {
        // Filter studentYears and studentEducation arrays based on the selectedYear
        const filteredStudent = {
          ...student, // Keep all student fields
          studentYears: student.studentYears.filter(
            (year) => year.academicYear === selectedYear
          ),
          studentEducation: student.studentEducation.filter(
            (education) => education.schoolYear === selectedYear
          ),
        };
        return filteredStudent;
      });

      return section;
    });
    //console.log(sections, "sections");

    if (
      selectedYear &&
      selectedYear === "1000" &&
      criteria === "forSchoolSections"
    ) {
      //rearrange data structure for schoolsectionslist
      // Transform data into the desired structure
      const groupedData = filteredSections.reduce((acc, section) => {
        section.students.forEach((student) => {
          const schoolName = student.studentEducation.attendedSchool.schoolName;
          const studentDetails = {
            studentName: student.studentName,
            studentSex: student.studentSex,
            sectionLabel: section.sectionLabel,
            sectionFrom: section.sectionFrom,
            sectionTo: section.sectionTo,
            classroomLabel: section.sectionLocation.classroomLabel,
            classroomNumber: section.sectionLocation.classroomNumber,
          };

          // Check if school already exists in the accumulator
          let schoolEntry = acc.find(
            (school) => school.schoolName === schoolName
          );

          if (!schoolEntry) {
            // If school doesn't exist, create a new entry
            schoolEntry = { schoolName, students: [] };
            acc.push(schoolEntry);
          }

          // Add student details to the school's students array
          schoolEntry.students.push(studentDetails);
        });

        return acc;
      }, []);

      //console.log(groupedData);
      return res.json(groupedData);
    }

    return res.json(filteredSections);
  }

  // If no ID is provided, fetch all sections
});

//----------------------------------------------------------------------------------
// @desc Create new section
// @route POST 'desk/section
// @access Private
const createNewSection = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    sectionLabel,
    sectionYear,
    students,
    sectionColor,
    sectionType,
    sectionFrom,
    sectionTo,
    sectionAnimator,
    sectionLocation,
    operator,
    creator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !sectionLabel ||
    !sectionYear ||
    !students ||
    students.length === 0 ||
    !sectionColor ||
    !sectionType ||
    !sectionFrom ||
    !sectionAnimator ||
    !sectionLocation ||
    !operator ||
    !creator
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await Section.findOne({
    sectionYear,
    sectionType,
    sectionLabel,
  })
    .lean()
    .exec(); //because we re receiving only one response from mongoose

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate section: ${duplicate.sectionLabel}  ${duplicate.sectionType} , found for ${duplicate.sectionYear}`,
    });
  }

  const sectionObject = {
    sectionLabel,
    sectionYear,
    students,
    sectionColor,
    sectionType,
    sectionFrom,
    sectionTo,
    sectionAnimator,
    sectionLocation,
    operator,
    creator,
  }; //construct new section to be stored
  //we need to make sure no studetn is in two sections at a time. so sections will not reflect historical state, but only actual state,
  //we also making that the sectin inthe queries session is the one with no sectionTO variable meaning current
  /////////////////
  const foundSections = await Section.find({ sectionYear }); // Resolve the query to get the array
  const isMatchingSection = foundSections.some((section) =>
    sectionObject.students.some(
      (student) =>
        (section.students.includes(student.toString()) && // Check if the student exists in both arrays
          new Date(sectionObject?.sectionFrom) <
            new Date(section.sectionFrom)) ||
        (section.students.includes(student.toString()) &&
          new Date(sectionObject?.sectionFrom) >
            new Date(section.sectionFrom) &&
          (section.sectionTo !== "" ||section.sectionTo !== null||
            new Date(sectionObject?.sectionFrom) < new Date(section.sectionTo))) // Date condition
    )
  );

  if (isMatchingSection) {
    return res.status(409).json({
      message: `student(s) found in another section for the dates chosen`,
    });
  }
  /////////////////check if the animator is already in other sections
  const foundAnimSections = await Section.find({
    sectionYear,
    sectionAnimator,
  }); // Resolve the query to get the array

  console.log(foundAnimSections);
  const isMatchingAnimSection = foundAnimSections.some(
    (section) =>
      (sectionObject?.sectionAnimator.toString() ===
        section?.sectionAnimator.toString() && // Check if the student exists in both arrays
        new Date(sectionObject?.sectionFrom) < new Date(section.sectionFrom)) ||
      (sectionObject?.sectionAnimator.toString() ===
        section?.sectionAnimator.toString() &&
        new Date(sectionObject?.sectionFrom) > new Date(section.sectionFrom) &&
        (section.sectionTo !== "" ||section.sectionTo !== null||
          new Date(sectionObject?.sectionFrom) < new Date(section.sectionTo))) // Date condition
  );

  if (isMatchingAnimSection) {
    return res.status(409).json({
      message: `animator found in another section for the chosen dates`,
    });
  }

  // Create and store new section
  const section = await Section.create(sectionObject);

  if (section) {
    // Get the new section ID
    const newSectionId = section._id;

    // Update each student in section.students with studentSection = newSectionId
    await Student.updateMany(
      { _id: { $in: section.students } }, // Filter: only students in section.students array
      { $set: { studentSection: newSectionId } } // Update: set studentSection to newSectionId
    );
    // If created and students updated
    res.status(201).json({
      message: `Section created and students updated successfully`,
    });
  } else {
    res.status(400).json({ message: "Invalid data received" });
  }
});

// @desc Update a section
// @route PATCH '/section
// @access Private
const updateSection = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that section in any other, the latter will have an ending date
  const {
    id,
    isChangeFlag,
    sectionLabel,
    sectionYear,
    students,
    sectionColor,
    sectionType,
    sectionFrom,
    sectionAnimator,
    sectionLocation,
    operator,
  } = req?.body;

  // Confirm data
  if (
    !id ||
    !sectionLabel ||
    isChangeFlag === undefined || // Checks if isChangeFlag is undefined
    !sectionYear ||
    !students ||
    students.length === 0 ||
    !sectionColor ||
    !sectionType ||
    !sectionFrom ||
    !sectionAnimator ||
    !sectionLocation ||
    !operator
  ) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the section exist to update?
  const sectionToUpdate = await Section.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!sectionToUpdate) {
    return res.status(400).json({ message: "Section to update not found" });
  }
  if (isChangeFlag) {
    //studetns, composition was changed, or animator changed

    //check no student  or animator of the new section is already present in other current sections
    const oldSections = await Section.find({ sectionYear }); // Resolve the query to get the array

    const isMatchingSection = oldSections.some((section) =>
      sectionToUpdate.students.some(
        (student) =>
          (section.students.includes(student.toString()) && // Check if the student exists in both arrays
            new Date(sectionToUpdate?.sectionFrom) <
              new Date(section.sectionFrom)) ||
          (section.students.includes(student.toString()) &&
            new Date(sectionToUpdate?.sectionFrom) >
              new Date(section.sectionFrom) &&
            (section.sectionTo !== "" ||section.sectionTo !== null||
              new Date(sectionToUpdate?.sectionFrom) <
                new Date(section.sectionTo))) // Date condition
      )
    );

    if (isMatchingSection) {
      return res.status(409).json({
        message: `student(s) found in another section for the dates chosen`,
      });
    }
    /////////////////check if the animator is already in other sections
    const foundAnimSections = await Section.find({
      sectionYear,
      sectionAnimator,
    }); // Resolve the query to get the array

    const isMatchingAnimSection = foundAnimSections.some(
      (section) =>
        (sectionToUpdate?.sectionAnimator.toString() ===
          section?.sectionAnimator.toString() && // Check if the student exists in both arrays
          new Date(sectionToUpdate?.sectionFrom) <
            new Date(section.sectionFrom)) ||
        (sectionToUpdate?.sectionAnimator.toString() ===
          section?.sectionAnimator.toString() &&
          new Date(sectionToUpdate?.sectionFrom) >
            new Date(section.sectionFrom) &&
          (section.sectionTo !== "" ||section.sectionTo !== null||
            new Date(sectionToUpdate?.sectionFrom) <
              new Date(section.sectionTo))) // Date condition
    );

    if (isMatchingAnimSection) {
      return res.status(409).json({
        message: `animator found in another section for the chosen dates`,
      });
    }

    //if there was a change we set sectionTo and create a new section with new data
    sectionToUpdate.sectionTo = sectionFrom;
   
    const updatedSection = await sectionToUpdate.save(); //save old section
    
    const newSectionFrom = new Date(sectionFrom);
    newSectionFrom.setSeconds(newSectionFrom.getSeconds() + 1); // Increment by one second

    //console.log(sectionToUpdate,'sectionToUpdate')
    const newSectionObject = {
      sectionLabel,
      sectionYear,
      students,
      sectionColor,
      sectionType,
      sectionFrom: newSectionFrom, //the starting dat aof new section is ending date of old section plus a second toavoid concurrnce
      sectionTo: null,
      sectionAnimator,
      sectionLocation,
      operator,
      creator: operator,
    }; //construct new section to be stored
/// we need to remove the setudetnSection from studetn that are no more in that old section:
await Student.updateMany(
  { studentSection: id },
  { $unset: { studentSection: "" } }
);



    // Create and store new section
    const newSection = await Section.create(newSectionObject);

    if (newSection) {
      // Update students with new section ID
      await Student.updateMany(
        { _id: { $in: students } },
        { $set: { studentSection: newSection._id } }
      );

      return res.status(201).json({
        message: `Section updated and another created successfully`,
      });
    } else {
      return res.status(400).json({ message: "Invalid data received" });
    }
  }
  if (isChangeFlag !== undefined && !isChangeFlag) {
    //no students were changed so we only update the curretn section
    //if there was a change we set sectionTo and create a new section with new data
    // sectionToUpdate.sectionTo = sectionTo //it will only allow updating properties that are already existant in the model
    sectionToUpdate.sectionLabel = sectionLabel;
    sectionToUpdate.sectionYear = sectionYear;
    //sectionToUpdate.students, //because no student swere added or removed
    sectionToUpdate.sectionColor = sectionColor;
    sectionToUpdate.sectionType = sectionType;
    sectionToUpdate.sectionFrom = sectionFrom;

    sectionToUpdate.sectionAnimator = sectionAnimator;
    sectionToUpdate.sectionLocation = sectionLocation;
    sectionToUpdate.operator = operator;

    // update section
    const updatedSection = await sectionToUpdate.save(); //save old section

    if (updatedSection) {
      // Update students with the updated section's ID
      await Student.updateMany(
        { _id: { $in: students } },
        { $set: { studentSection: updatedSection._id } }
      );

      res.status(201).json({
        message: `Section  updated successfully`,
      });
    } else {
      return res.status(400).json({ message: "Invalid data received" });
    }
  }
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteSection = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the user exist to delete?
  const section = await Section.findById(id).exec();

  if (!section) {
    return res.status(400).json({ message: "Section not found" });
  }
  // Remove the section from students' `studentSection` field
  await Student.updateMany(
    { studentSection: id },
    { $unset: { studentSection: "" } }
  );

  // Delete the section
  const result = await section.deleteOne();

  const reply = `Deleted ${result?.deletedCount} section`;

  return res.json({ message: reply });
});

module.exports = {
  getAllSections,
  createNewSection,
  updateSection,
  deleteSection,
};
