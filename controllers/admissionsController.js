// const User = require('../models/User')
const Admission = require("../models/Admission"); //we might need the parent module in this controller
const Student = require("../models/Student");
const Service = require("../models/Service"); //we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");




// @desc Get all admissions
// @route GET 'admissions/admissionsParents/admissions
// @access Private // later we will establish authorisations
const getAllAdmissions = asyncHandler(async (req, res) => {
  // Check if the request has selectedYear or id query parameters
  //console.log('getting the query', req.query)
  if (req.query.selectedYear) {
    const { selectedYear } = req.query;

    if (selectedYear === "1000") {
      // Fetch all admissions if selectedYear is '1000'
      const admissions = await Admission.find().lean();
      if (!admissions?.length) {
        return res.status(400).json({ message: "No admissions found!" });
      }
      return res.json(admissions);
    } else {
      // Fetch admissions for the selected year
      //console.log('with yearrrrrrrrrrrrrrrrrrr select', selectedYear);
      const admissions = await Admission.find({ admissionYear: selectedYear })
        .populate("agreedServices.service", "-serviceCreator -serviceOperator") // Exclude these fields
        .populate("student", "studentName") // Populate student name
        .lean();

      //console.log('with yeaaaaaaaaaaaaaaaaaar select', selectedYear, admissions);
      if (!admissions?.length) {
        return res
          .status(400)
          .json({
            message: "No admissions found for the selected academic year",
          });
      }
      return res.json(admissions);
    }
  } else if (req.query.id) {
    // Fetch admission by ID
    const { id } = req.query;
    const admission = await Admission.find({ _id: id }).populate('student').lean();
//console.log('admssion with id', admission)
    if (!admission?.length) {
      return res
        .status(400)
        .json({ message: "No admission found for the provided Id" });
    }
    return res.json(admission);
  } else {
    // Fetch all admissions if no query parameters
    const admissions = await Admission.find().lean();
    if (!admissions?.length) {
      return res.status(400).json({ message: "No admissions found" });
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

  const {
    student,
    admissionCreator,
    admissionOperator,
    admissionDate,
    admissionYear,
    agreedServices,
  } = req.body; //this will come from front end we put all the fields o fthe collection here
  //console.log(admissionName, admissionDob,  admissionSex, admissionIsActive, admissionYears, admissionGardien, admissionEducation, lastModified)
  //Confirm data is present in the request with all required fields
  if (
    !student ||
    !admissionCreator ||
    !admissionOperator ||
    !admissionDate ||
    !admissionYear ||
    !agreedServices
  ) {
    return res.status(400).json({ message: "All fields are required" }); //400 : bad request
  }

  // Check for duplicate
  const duplicate = await Admission.findOne({
    student, // Match the same student
    admissionYear, // Match the same admission year
    //'agreedServices.service': agreedServices?.service          // Match the agreedServices.service field
  })
    .lean()
    .exec();

  if (duplicate) {
    return res
      .status(409)
      .json({
        message: ` duplicate admission name for student ${duplicate.student} and service ${duplicate.agreedServices} `,
      });
  }

 // Modify agreedServices array to set isAuthorised: true where isFlagged is false
 const modifiedAgreedServices = agreedServices.map(service => {
  if (service.isFlagged === false) {
    return { ...service, isAuthorised: true }; // Set isAuthorised to true
  } else if(service.isFlagged === true) {
    return { ...service, isAuthorised: false }}
  return service;
})

//console.log(modifiedAgreedServices,'modifiedAgreedServices')
const admissionObject = {
  student,
  admissionCreator,
  admissionOperator,
  admissionDate,
  admissionYear,
  agreedServices:modifiedAgreedServices,
}; //construct new admission to be stored
//set is authjorised for everfy isFLagged:false

console.log(admissionObject.agreedServices,'modifiedAgreedServices')


  // Create and store new admission
  const admission = await Admission.create(admissionObject);

  if (admission) {
    // Find the student by _id
    const studentToUpdateWithAdmission = await Student.findOne({
      _id: student,
    });

    if (studentToUpdateWithAdmission) {
      // Find the year object in studentYears that matches the admissionYear
      const studentYearToUpdate =
        studentToUpdateWithAdmission.studentYears.find(
          (year) => year.academicYear === admission.admissionYear
        );

      // If the year is found, add the admission key with admission._id
      if (studentYearToUpdate) {
        studentYearToUpdate.admission = admission._id;
      }

      // Save the updated student document
      await studentToUpdateWithAdmission.save();

      res.status(201).json({
        message: `New admission for student ${admission.student} and service ${admission.agreedServices} created`,
      });
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } else {
    res.status(400).json({ message: "Invalid admission data received" });
  }
});
//internalcontroller :CreateNew User to be used by other controllers??

// @desc Update a admission
// @route PATCH 'admissions/admissionsParents/admissions
// @access Private
const updateAdmission = asyncHandler(async (req, res) => {
  const {
    admissionId,
    student,
    admissionDate,
    admissionYear,
    admissionOperator,
    agreedServices,
  } = req.body;
  console.log(req.body);
  // Confirm data
  if ( !admissionId || !student || !admissionDate || !admissionYear || !admissionOperator || !agreedServices || agreedServices?.length===0) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Does the admission exist to update?
  const admission = await Admission.findById(admissionId).exec(); //we did not lean becausse we need the save method attached to the response

  if (!admission) {
    return res.status(400).json({ message: "Admission not found" });
  }

  // Check for duplicate
  const duplicate = await Admission.findOne({ student }).lean().exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== admissionId) {
    return res.status(409).json({ message: "Duplicate Admission" });
  }

  admission.admissionDate = admissionDate; //it will only allow updating properties that are already existant in the model
  admission.admissionOperator = admissionOperator;
  admission.agreedServices = agreedServices;


  const updatedAdmission = await admission.save(); //save method received when we did not include lean

  res.json({
    message: `admission ${ updatedAdmission._id }, updated`,
  });
});
//--------------------------------------------------------------------------------------1
// @desc Delete a admission
// @route DELETE 'admissions/admissionsParents/admissions
// @access Private
const deleteAdmission = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Admission Id Required" });
  }



  // Does the admission exist to delete?
  const admissionToDelete = await Admission.findById(id).exec();

  if (!admissionToDelete) {
    return res.status(400).json({ message: "Admission not found" });
  }
  
  
  const result = await admissionToDelete.deleteOne();
  if( result.acknowledged){
  await Student.updateMany(
    { "studentYears.admission": id }, // Match students where an admission field in studentYears equals the id
    { $unset: { "studentYears.$[elem].admission": "" } }, // Unset (remove) the admission field
    {
      arrayFilters: [
        { "elem.admission": id }, // Filter array elements where admission equals the id
      ],
    }
  );
  const reply = `confirm: deleted ${result.deletedCount} admissions , with ID ${admissionToDelete._id} `;

  return res.json(reply);
}//if failed to delete admission
const reply= `confirm: deleted ${result.deletedCount} admissions `
return res.status(400).json(reply);
  


  
  
});

module.exports = {
  getAllAdmissions,
  createNewAdmission,
  updateAdmission,
  deleteAdmission,
};
