// const User = require('../models/User')
const Admission = require('../models/Admission')//we might need the parent module in this controller
const Student = require('../models/Student')
const Service = require('../models/Service')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')





// @desc Get all admissions
// @route GET 'admissions/admissionsParents/admissions             
// @access Private // later we will establish authorisations
const getAllAdmissions = asyncHandler(async (req, res) => {
    // Check if the request has selectedYear or id query parameters
    if (req.query.selectedYear) {
      const { selectedYear } = req.query;
  
      if (selectedYear === '1000') {
        // Fetch all admissions if selectedYear is '1000'
        const admissions = await Admission.find().lean();
        if (!admissions?.length) {
          return res.status(400).json({ message: 'No admissions found!' });
        }
        return res.json(admissions);
      } else {
        // Fetch admissions for the selected year
        //console.log('with yearrrrrrrrrrrrrrrrrrr select', selectedYear);
        const admissions = await Admission.find({ admissionYear: selectedYear })
          .populate('agreedServices.service', '-serviceCreator -serviceOperator') // Exclude these fields
          .populate('student', 'studentName') // Populate student name
          .lean();
  
        //console.log('with yeaaaaaaaaaaaaaaaaaar select', selectedYear, admissions);
        if (!admissions?.length) {
          return res.status(400).json({ message: 'No admissions found for the selected academic year' });
        }
        return res.json(admissions);
      }
    } else if (req.query.id) {
      // Fetch admission by ID
      const { id } = req.query;
      const admission = await Admission.find({ _id: id }).lean();
  
      if (!admission?.length) {
        return res.status(400).json({ message: 'No admission found for the provided Id' });
      }
      return res.json(admission);
    } else {
      // Fetch all admissions if no query parameters
      const admissions = await Admission.find().lean();
      if (!admissions?.length) {
        return res.status(400).json({ message: 'No admissions found' });
      }
      return res.json(admissions);
    }
  });
  

//----------------------------------------------------------------------------------
// @desc Create new user
// @route POST 'admissions/admissionsParents/admissions
// @access Private
const createNewAdmission = asyncHandler(async (req, res) => {
 
//console.log(req.body,'request body')

    const { student, admissionCreator, admissionOperator, admissionDate, admissionYear, agreedServices } = req.body//this will come from front end we put all the fields o fthe collection here
//console.log(admissionName, admissionDob,  admissionSex, admissionIsActive, admissionYears, admissionGardien, admissionEducation, lastModified)
    //Confirm data is present in the request with all required fields
    if ( !student || !admissionCreator || !admissionOperator || !admissionDate || !admissionYear || !agreedServices ) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }

    
    // Check for duplicate 
    const duplicate = await Admission.findOne({
      student,                               // Match the same student
      admissionYear,                         // Match the same admission year
      //'agreedServices.service': agreedServices?.service          // Match the agreedServices.service field
    }).lean().exec();

    if (duplicate) {
        return res.status(409).json({ message: ` duplicate admission name for student ${duplicate.student} and service ${duplicate.agreedServices} ` })
    }
   
   
    const admissionObject = { student, admissionCreator, admissionOperator, admissionDate, admissionYear, agreedServices}//construct new admission to be stored

    // Create and store new admission 
    const admission = await Admission.create(admissionObject)

    if (admission) {
      // Find the student by _id
      const studentToUpdateWithAdmission = await Student.findOne({ _id: student });
  
      if (studentToUpdateWithAdmission) {
          // Find the year object in studentYears that matches the admissionYear
          const studentYearToUpdate = studentToUpdateWithAdmission.studentYears.find(
              year => year.academicYear === admission.admissionYear
          );
  
          // If the year is found, add the admission key with admission._id
          if (studentYearToUpdate) {
              studentYearToUpdate.admission = admission._id;
          }
  
          // Save the updated student document
          await studentToUpdateWithAdmission.save();
  
          res.status(201).json({
              message: `New admission for student ${admission.student} and service ${admission.agreedServices} created`
          });
      } else {
          res.status(404).json({ message: 'Student not found' });
      }
  } else {
        res.status(400).json({ message: 'Invalid admission data received' })
    }
}
)
//internalcontroller :CreateNew User to be used by other controllers??


// @desc Update a admission
// @route PATCH 'admissions/admissionsParents/admissions
// @access Private
const updateAdmission = asyncHandler(async (req, res) => {
    const { id, admissionName, admissionDob,  admissionSex, admissionIsActive, admissionYears, admissionJointFamily,admissionContact, admissionGardien, admissionEducation, operator,  
        admissions  } = req.body
console.log(req.body)
    // Confirm data 
    if (!admissionName || !admissionDob ||!admissionSex ||!admissionYears ) {
        return res.status(400).json({ message: 'All fields except required' })
    }

    // Does the admission exist to update?
    const admission = await Admission.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!admission) {
        return res.status(400).json({ message: 'Admission not found' })
    }

    // Check for duplicate 
    const duplicate = await Admission.findOne({ admissionName }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate name' })
    }

    admission.admissionName = admissionName//it will only allow updating properties that are already existant in the model
    admission.admissionDob = admissionDob
    admission.admissionSex = admissionSex
    admission.admissionIsActive = admissionIsActive
    admission.admissionYears = admissionYears
    admission.admissionJointFamily = admissionJointFamily
    admission.admissionContact = admissionContact
    admission.admissionGardien = admissionGardien
    admission.admissionEducation = admissionEducation
    admission.operator = operator
    admission.admissions = admissions
   
    const updatedAdmission = await admission.save()//save method received when we did not include lean

    res.json({ message: `admission ${updatedAdmission.admissionName.firstName+" "+updatedAdmission.admissionName.middleName+" "+updatedAdmission.admissionName.lastName}, updated` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a admission
// @route DELETE 'admissions/admissionsParents/admissions
// @access Private
const deleteAdmission = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Admission Id Required' })
    }

    // Does the user still have assigned notes?
    // const note = await Note.findOne({ user: id }).lean().exec()
    // if (note) {
    //     return res.status(400).json({ message: 'User has assigned notes' })
    // }


    // Does the user exist to delete?
    const admissionToDelete = await Admission.findById(id).exec()

    if (!admissionToDelete) {
        return res.status(400).json({ message: 'Admission not found' })
    }

    const result = await admissionToDelete.deleteOne()
console.log(result,'result')
    const reply = `confirm:  ${result} admission ${admissionToDelete.admissionName.firstName+" "+admissionToDelete.admissionName.middleName+" "+admissionToDelete.admissionName.lastName}, with ID ${admissionToDelete._id} deleted`

    res.json(reply)
})



module.exports = {
    getAllAdmissions,
    createNewAdmission,
    updateAdmission,
    deleteAdmission,
    
    
}