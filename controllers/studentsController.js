// const User = require('../models/User')
const Student = require("../models/Student"); //we might need the parent module in this controller
const Family = require("../models/Family"); //we might need the parent module in this controller
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch
const useSelectedAcademicYear = require("../middleware/setCurrentAcademicYear");
const mongoose = require("mongoose");

//function to get only the studetns with no families
async function getStudentsNotInFamily() {
  try {
    // Step 1: Find all students that are part of any family
    const families = await Family.find({}, "children.child").lean();

    // Extract student ObjectId references from all families
    const studentsInFamilies = families.flatMap((family) =>
      family.children.map((child) => child.child)
    );

    // Step 2: Find all students that are not in the `studentsInFamilies` list
    const studentsNotInFamilies = await Student.find({
      _id: { $nin: studentsInFamilies },
    }).lean();

    return studentsNotInFamilies;
  } catch (error) {
    console.error("Error fetching students not in families:", error);
    throw error;
  }
}

// @desc Get all students
// @route GET 'students/studentsParents/students
// @access Private // later we will establish authorisations
const getAllStudents = asyncHandler(async (req, res) => {
  // Get all students from MongoDB
  //console.log('teh request', req.query)
  if (req.query.selectedYear) {
    const { selectedYear } = req.query; //maybe replace the conditionals with the current year that we get  from middleware
    //console.log(selectedYear, "sleected year inback")
    //will retrive all teh students
    if (selectedYear === "1000") {
      const students = await Student.find().lean();
      if (!students?.length) {
        return res.status(400).json({ message: "No students found!" });
      } else {
        //console.log('returned res', students)

        // if students found, we check if the criteria : 'No Family 'is present
        if (req.query.criteria && req.query.criteria === "No Family") {
          getStudentsNotInFamily()
            .then((students) => {
              res.json(students);
            })
            .catch((error) => {
              console.error(error);
            });
        } else {
          res.json(students);
        }
      }
    }
    if (selectedYear !== "1000") {
      if (req.query?.criteria === "withAdmission") {//needed for new enrolment form////////////////////
        //will retrieve only the selcted year
        // const students = await Student.find({
        //     studentYears: {
        //       $elemMatch: {
        //         academicYear: selectedYear,  // Match academicYear to selectedYear
        //         admission: { $exists: true, $ne: null }, // Ensure admission exists and is not null
        //       },
        //     },
        //   }).lean(); //this will not return the extra data(lean)
        const students = await Student.aggregate([
          // Match students with studentYears containing the selected academic year and a non-null admission
          {
            $match: {
              studentYears: {
                $elemMatch: {
                  academicYear: selectedYear,
                  admission: { $exists: true, $ne: null }
                }
              }
            }
          },
          // Unwind the studentYears array to work with individual elements
          { $unwind: "$studentYears" },
          // Match only studentYears for the selected academic year
          {
            $match: {
              "studentYears.academicYear": selectedYear,
              "studentYears.admission": { $exists: true, $ne: null }
            }
          },
          // Lookup (populate) the admission field in studentYears
          {
            $lookup: {
              from: "admissions", // The admission collection
              localField: "studentYears.admission",
              foreignField: "_id",
              as: "studentYears.admissionDetails"
            }
          },
          // Unwind the admissionDetails array (because lookup returns an array)
          { $unwind: "$studentYears.admissionDetails" },
          // Unwind agreedServices so that each agreedService is treated individually
          { $unwind: "$studentYears.admissionDetails.agreedServices" },
          // Lookup (populate) the service field inside agreedServices
          {
            $lookup: {
              from: "services", // The service collection
              localField: "studentYears.admissionDetails.agreedServices.service",
              foreignField: "_id",
              as: "studentYears.admissionDetails.agreedServices.serviceDetails"
            }
          },
          // Unwind the serviceDetails array (since it's an array after lookup)
          { $unwind: "$studentYears.admissionDetails.agreedServices.serviceDetails" },
          // Project the necessary fields, including feeValue, feePeriod, feeStartDate, feeEndDate, isFlagged, isAuthorised, comment, and serviceDetails
          {
            $project: {
              _id: 1,
              studentName: 1, // Include studentName directly
              academicYear: "$studentYears.academicYear", // Include academicYear
              admission: "$studentYears.admission", // Include admission ID
              admissionDetails: {
                admissionYear: "$studentYears.admissionDetails.admissionYear", // Admission year
                admissionDate: "$studentYears.admissionDetails.admissionDate", // Admission date
                // Flatten the agreedServices object and include the relevant service details
                agreedServices: {
                  serviceDetails: "$studentYears.admissionDetails.agreedServices.serviceDetails", // Direct reference to service details
                  feeValue: "$studentYears.admissionDetails.agreedServices.feeValue", // Fee value
                  feePeriod: "$studentYears.admissionDetails.agreedServices.feePeriod", // Fee period
                  feeStartDate: "$studentYears.admissionDetails.agreedServices.feeStartDate", // Fee start date
                  feeMonths: "$studentYears.admissionDetails.agreedServices.feeMonths", // Fee Months
                  feeEndDate: "$studentYears.admissionDetails.agreedServices.feeEndDate", // Fee end date
                  isFlagged: "$studentYears.admissionDetails.agreedServices.isFlagged", // Is flagged
                  isAuthorised: "$studentYears.admissionDetails.agreedServices.isAuthorised", // Is authorised
                  comment: "$studentYears.admissionDetails.agreedServices.comment" // Comment
                }
              }
            }
          },
          // Group by the student ID and merge the agreedServices into an array
          {
            $group: {
              _id: "$_id", // Group by student ID
              studentName: { $first: "$studentName" }, // Keep the student's name
              academicYear: { $first: "$academicYear" }, // Keep the academic year
              admission: { $first: "$admission" }, // Keep the admission ID
              admissionDetails: {
                $first: {
                  admissionYear: "$admissionDetails.admissionYear", // Keep the admission year
                  admissionDate: "$admissionDetails.admissionDate", // Keep the admission date
                }
              },
              agreedServices: {
                $push: "$admissionDetails.agreedServices" // Merge all agreedServices into an array
              }
            }
          },
          // Replace the root document with the student object
          {
            $project: {
              _id: 1,
              studentName: 1,
              academicYear: 1,
              admission: 1,
              admissionDetails: {
                admissionYear: "$admissionDetails.admissionYear",
                admissionDate: "$admissionDetails.admissionDate",
                agreedServices: "$agreedServices" // Populate agreedServices array
              }
            }
          }
        ]).exec();
        
          
        if (!students?.length) {
          return res.status(400).json({
            message: "No students with admissions found  for the selected academic year",
          });
        } else {
          //console.log('returned res', students)
          return res.json(students);
        }
      }
      // if (req.query?.criteria === "withEducation") {//needed for new section list form////////////////////
      //   const students = await Student.find()
      // }

      //will retrieve only the selcted year
      const students = await Student.find({
        studentYears: { $elemMatch: { academicYear: selectedYear } },
      }).lean(); //this will not return the extra data(lean)
      //const students = await Student.find({ studentYear: '2023/2024' }).lean()//this will not return the extra data(lean)
      //console.log('with year select',selectedYear,  students)
      if (!students?.length) {
        return res.status(400).json({
          message: "No students found  for the selected academic year",
        });
      } else {
        //console.log('returned res', students)
        res.json(students);
      }
    }
    //will retreive according to the id
  } else if (req.query.id) {
    const { id } = req.query;
    const student = await Student.find({ _id: id }).lean(); //this will not return the extra data(lean)//removed populate father and mother

    //console.log('with id  select')
    if (!student?.length) {
      return res
        .status(400)
        .json({ message: "No student found for the Id provided" });
    }
    //console.log('returned res', student)
    res.json(student);
  } else {
    const students = await Student.find().lean(); //this will not return the extra data(lean)
    //console.log('with no select')
    if (!students?.length) {
      return res.status(400).json({ message: "No students found" });
    }
    //console.log('returned res', students)
    res.json(students);
  }

  // If no students

  //res.json(students)
});

//----------------------------------------------------------------------------------
// @desc Create new user
// @route POST 'students/studentsParents/students
// @access Private
const createNewStudent = asyncHandler(async (req, res) => {
  const {
    studentName,
    studentDob,
    studentSex,
    studentIsActive,
    studentJointFamily,
    studentYears,
    studentGardien,
    studentEducation,
    lastModified,
  } = req.body; //this will come from front end we put all the fields o fthe collection here
  //console.log(studentName, studentDob,  studentSex, studentIsActive, studentYears, studentGardien, studentEducation, lastModified)
  //Confirm data is present in the request with all required fields
  if (!studentName || !studentDob || !studentSex || !studentYears) {
    return res.status(400).json({ message: "All fields are required" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await Student.findOne({ studentDob }).lean().exec(); //because we re receiving only one response from mongoose

  if (
    duplicate?.studentName.lastName === studentName.lastName &&
    duplicate?.studentSex === studentSex
  ) {
    return res.status(409).json({
      message: ` possible duplicate student name ${duplicate.studentName.firstName} ${duplicate.studentName.middleName} ${duplicate.studentName.lastName}`,
    });
  }

  const studentObject = {
    studentName,
    studentDob,
    studentSex,
    studentIsActive,
    studentJointFamily,
    studentYears,
    studentGardien,
    studentEducation,
    lastModified,
  }; //construct new student to be stored

  // Create and store new student
  const student = await Student.create(studentObject);

  if (student) {
    //if created
    res.status(201).json({
      message: `New student ${studentName.firstName} ${studentName.middleName} ${studentName.lastName} created`,
    });
  } else {
    res.status(400).json({ message: "Invalid student data received" });
  }
});
//internalcontroller :CreateNew User to be used by other controllers??

// @desc Update a student
// @route PATCH 'students/studentsParents/students
// @access Private
const updateStudent = asyncHandler(async (req, res) => {
  const {
    id,
    studentName,
    studentDob,
    studentSex,
    studentIsActive,
    studentYears,
    studentJointFamily,
    studentContact,
    studentGardien,
    studentEducation,
    operator,
    admissions,
  } = req.body;
  console.log(req.body);
  // Confirm data
  if (!studentName || !studentDob || !studentSex || !studentYears) {
    return res.status(400).json({ message: "All fields except required" });
  }

  // Does the student exist to update?
  const student = await Student.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!student) {
    return res.status(400).json({ message: "Student not found" });
  }

  // Check for duplicate
  const duplicate = await Student.findOne({ studentName }).lean().exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate name" });
  }

  student.studentName = studentName; //it will only allow updating properties that are already existant in the model
  student.studentDob = studentDob;
  student.studentSex = studentSex;
  student.studentIsActive = studentIsActive;
  student.studentYears = studentYears;
  student.studentJointFamily = studentJointFamily;
  student.studentContact = studentContact;
  student.studentGardien = studentGardien;
  student.studentEducation = studentEducation;
  student.operator = operator;
  student.admissions = admissions;

  const updatedStudent = await student.save(); //save method received when we did not include lean

  res.json({
    message: `student ${
      updatedStudent.studentName.firstName +
      " " +
      updatedStudent.studentName.middleName +
      " " +
      updatedStudent.studentName.lastName
    }, updated`,
  });
});
//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Student Id Required" });
  }

  // Does the user still have assigned notes?
  // const note = await Note.findOne({ user: id }).lean().exec()
  // if (note) {
  //     return res.status(400).json({ message: 'User has assigned notes' })
  // }

  // Does the user exist to delete?
  const studentToDelete = await Student.findById(id).exec();

  if (!studentToDelete) {
    return res.status(400).json({ message: "Student not found" });
  }

  const result = await studentToDelete.deleteOne();
  console.log(result, "result");
  const reply = `confirm:  ${result} student ${
    studentToDelete.studentName.firstName +
    " " +
    studentToDelete.studentName.middleName +
    " " +
    studentToDelete.studentName.lastName
  }, with ID ${studentToDelete._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllStudents,
  createNewStudent,
  updateStudent,
  deleteStudent,
};
