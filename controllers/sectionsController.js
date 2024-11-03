// const User = require('../models/User')
const Section = require("../models/Section");
const AttendedSchool = require("../models/AttendedSchool");

//const Employee = require('../models/Employee')//we might need the employee module in this controller
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

    // Find a single section by its ID
    const section = await Section.findOne({ _id: id })
      .populate("students", "-operator -studentDob -studentGardien -updatedAt")
      .lean();

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    return res.json(section);
  }
  if (selectedYear) {
    const selectedYear = req.query?.selectedYear;

    if (selectedYear !== "1000") {
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

//rearrange for the schoolsections
if (criteria === "forSchoolSections") {
  //rearrange data structure for schoolsectionslist
  // Transform data into the desired structure
  console.log(sections,'sections')
  let schoolIdCounter = 1; // Initialize a global counter for unique school IDs

const groupedData = sections.reduce((acc, section) => {
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
    let schoolEntry = acc.find((school) => school.schoolName === schoolName);

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

  
console.log(groupedData)
  return res.json(groupedData);
  
}




        // Return sections as JSON
        return res.json(sections);
      } catch (error) {
        console.error("Error fetching sections:", error);
        return res
          .status(500)
          .json({ message: "Server error while fetching sections" });
      }
    } else {
      const sections = await Section.find()
        .populate(
          "students",
          "-operator -studetnDob -studentGardien -updatedAt"
        )
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

      if (criteria === "forSchoolSections") {
        //rearrange data structure for schoolsectionslist
        // Transform data into the desired structure
        const groupedData = filteredSections.reduce((acc, section) => {
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
              // If school doesn't exist, create a new entry
              schoolEntry = { schoolName, students: [] };
              acc.push(schoolEntry);
            }

            // Add student details to the school's students array
            schoolEntry.students.push(studentDetails);
          });

          return acc;
        }, []);

        return res.json(groupedData);
        console.log(groupedData);
      }

      return res.json(filteredSections);
    }
  }
  // If no ID is provided, fetch all sections
});

//----------------------------------------------------------------------------------
// @desc Create new section
// @route POST 'desk/section
// @access Private
const createNewSection = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  const { schoolName, schoolCity, schoolType } = req?.body; //this will come from front end we put all the fields o fthe collection here
  console.log(schoolName, schoolCity, schoolType);
  //Confirm data is present in the request with all required fields

  if (!schoolName || !schoolCity || !schoolType) {
    return res
      .status(400)
      .json({ message: "All mandatory fields are required" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await Section.findOne({ schoolName }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicate && duplicate.schoolType == schoolType) {
    return res
      .status(409)
      .json({ message: `Duplicate section: ${duplicate.schoolName}, found` });
  }

  const sectionObject = { schoolName, schoolCity, schoolType }; //construct new section to be stored

  // Create and store new section
  const section = await Section.create(sectionObject);

  if (section) {
    //if created
    res.status(201).json({
      message: `New section of subject: ${section.schoolName}, created`,
    });
  } else {
    res.status(400).json({ message: "Invalid section data received" });
  }
});

// @desc Update a section
// @route PATCH 'desk/section
// @access Private
const updateSection = asyncHandler(async (req, res) => {
  // set all other related sessions to ending date where you have a student from that section in any other, the latter will have an ending date
  const { id, schoolName, schoolCity, schoolType } = req?.body;

  // Confirm data
  if (!id || !schoolName || !schoolCity || !schoolType) {
    return res.status(400).json({ message: "All mandatory fields required" });
  }

  // Does the section exist to update?
  const section = await Section.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!section) {
    return res.status(400).json({ message: "Section not found" });
  }

  section.schoolName = schoolName; //it will only allow updating properties that are already existant in the model
  section.schoolCity = schoolCity;
  section.schoolType = schoolType;

  const updatedSection = await section.save(); //save method received when we did not include lean

  res.json({ message: `section: ${updatedSection.schoolName}, updated` });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Section ID Required" });
  }

  // Does the user exist to delete?
  const section = await Section.findById(id).exec();

  if (!section) {
    return res.status(400).json({ message: "Section not found" });
  }

  const result = await section.deleteOne();

  const reply = `section ${section.sectionubject}, with ID ${section._id}, deleted`;

  res.json(reply);
});

module.exports = {
  getAllSections,
  createNewSection,
  updateSection,
  deleteSection,
};
