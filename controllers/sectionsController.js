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
  if (req?.query?.id) {
    const { id } = req.query;

    // Find a single section by its ID
    const section = await Section.findOne({ _id: id })
      .populate("students", "-operator -studentDob -studentGardien -updatedAt")
      .lean();

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    return res.json(section);
  }
  if (req.query?.selectedYear) {
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
              from: "classrooms", // Name of the Classroom collection
              localField: "sectionLocation", // Field from Section schema
              foreignField: "_id", // Field from Classroom schema
              as: "classroomDetails", // Name of the new array field to add
            },
          },
          {
            $unwind: {
              path: "$classroomDetails",
              preserveNullAndEmptyArrays: true,
            }, // Unwind to flatten the structure
          },
          {
            $unwind: "$students", // Deconstruct the students array
          },
          {
            $lookup: {
              from: "students", // Name of the students collection
              localField: "students", // Field from Section schema
              foreignField: "_id", // Field from Student schema
              as: "studentDetails", // Name of the new array field to add
            },
          },
          {
            $unwind: {
              path: "$studentDetails",
              preserveNullAndEmptyArrays: true,
            }, // Unwind to flatten the structure
          },
          {
            $lookup: {
              from: "attendedschools", // Name of the AttendedSchool collection
              localField: "studentDetails.studentEducation.attendedSchool", // Field from Student schema
              foreignField: "_id", // Field from AttendedSchool schema
              as: "attendedSchoolDetails", // Name of the new array field to add
            },
          },
          {
            $unwind: {
              path: "$attendedSchoolDetails",
              preserveNullAndEmptyArrays: true,
            }, // Unwind to flatten the structure
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
                  // Directly include the contents of studentYears as an object
                  $arrayElemAt: ["$studentDetails.studentYears", 0],
                },
                studentEducation: {
                  // Convert the studentEducation array to an object
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$studentDetails.studentEducation",
                        as: "education",
                        cond: { $eq: ["$$education.schoolYear", selectedYear] },
                      },
                    },
                    0,
                  ],
                },
                attendedSchool: {
                  schoolName: "$attendedSchoolDetails.schoolName",
                  schoolCity: "$attendedSchoolDetails.schoolCity",
                  schoolType: "$attendedSchoolDetails.schoolType",
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
