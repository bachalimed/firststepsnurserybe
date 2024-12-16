// const User = require('../models/User')
const Enrolment = require("../models/Enrolment"); //we might need the parent module in this controller
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
  const { selectedYear, criteria, id } = req.query;
  if (selectedYear) {
    if (selectedYear === "1000") {
      // Fetch all admissions if selectedYear is '1000'
      const admissions = await Admission.find().lean();
      if (!admissions?.length) {
        return res.status(400).json({ message: "No admissions found!" });
      }
      return res.json(admissions);
    } else {
      if (criteria === "noEnrolments") {
       const admissions = await Admission.aggregate([
  { 
    $match: { admissionYear: selectedYear } // Match admissions for the selected year
  },
  {
    $lookup: {
      from: "enrolments",
      let: { admissionId: "$_id" }, // Reference current admission _id
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$enrolmentYear", selectedYear] }, // Match enrolment year
                { $eq: ["$admission", "$$admissionId"] } // Match admission ID
              ]
            }
          }
        },
        {
          $project: {
            serviceType: 1,
            enrolmentMonth: 1,
          }
        }
      ],
      as: "enrolments"
    }
  },
  {
    $lookup: {
      from: "services",
      localField: "agreedServices.service",
      foreignField: "_id",
      as: "serviceDetails"
    }
  },
  {
    $addFields: {
      agreedServices: {
        $map: {
          input: "$agreedServices",
          as: "service",
          in: {
            $mergeObjects: [
              "$$service",
              {
                service: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$serviceDetails",
                        as: "serviceDetail",
                        cond: { $eq: ["$$service.service", "$$serviceDetail._id"] }
                      }
                    },
                    0
                  ]
                }
              }
            ]
          }
        }
      }
    }
  },
  {
    $addFields: {
      agreedServices: {
        $map: {
          input: "$agreedServices",
          as: "service",
          in: {
            $mergeObjects: [
              "$$service",
              {
                feeMonths: {
                  $filter: {
                    input: "$$service.feeMonths",
                    as: "month",
                    cond: {
                      $not: {
                        $in: [
                          "$$month",
                          {
                            $map: {
                              input: {
                                $filter: {
                                  input: "$enrolments",
                                  as: "enrol",
                                  cond: {
                                    $eq: ["$$enrol.serviceType", "$$service.service.serviceType"] // Compare serviceType
                                  }
                                }
                              },
                              as: "enrol",
                              in: "$$enrol.enrolmentMonth"
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      }
    }
  },
  {
    $addFields: {
      agreedServices: {
        $filter: {
          input: "$agreedServices",
          as: "service",
          cond: {
            $gt: [{ $size: "$$service.feeMonths" }, 0] // Ensure feeMonths is not empty
          }
        }
      }
    }
  },
  {
    $match: {
      "agreedServices.0": { $exists: true } // Only keep admissions with non-empty agreedServices
    }
  },
  {
    $lookup: {
      from: "students",
      localField: "student",
      foreignField: "_id",
      as: "student"
    }
  },
  {
    $unwind: "$student"
  },
  {
    $project: {
      "student._id": 1,
      "student.studentName": 1,
      "student.studentIsActive": 1,
      agreedServices: {
        service: 1,
        feeMonths: 1
      }
    }
  }
]);

return res.json(admissions);

        
        
        
      }

      // Fetch admissions for the selected year
      //console.log('with yearrrrrrrrrrrrrrrrrrr select', selectedYear);
      const admissions = await Admission.find({ admissionYear: selectedYear })
        .populate("agreedServices.service", "-serviceCreator -serviceOperator") // Exclude these fields
        .populate("student", "studentName") // Populate student name
        .lean();

      //console.log('with yeaaaaaaaaaaaaaaaaaar select', selectedYear, admissions);
      if (!admissions?.length) {
        return res.status(400).json({
          message: "No admissions found for the selected academic year",
        });
      }
      return res.json(admissions);
    }
  } else if (id) {
    // Fetch admission by ID
    const { id } = req.query;
    const admission = await Admission.find({ _id: id })
      .populate("student")
      .lean();
    //console.log('admssion with id', admission)
    if (!admission?.length) {
      return res
        .status(400)
        .json({ message: "No admission found for the provided Id" });
    }
    return res.json(admission);
  }
  // else {
  //   // Fetch all admissions if no query parameters
  //   const admissions = await Admission.find().lean();
  //   if (!admissions?.length) {
  //     return res.status(400).json({ message: "No admissions found" });
  //   }
  //   return res.json(admissions);
  // }
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
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
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
    return res.status(409).json({
      message: `Duplicate admission found`,
    });
  }

  // Modify agreedServices array to set isAuthorised: true where isFlagged is false
  const modifiedAgreedServices = agreedServices.map((service) => {
    if (service.isFlagged === false) {
      return { ...service, isAuthorised: true }; // Set isAuthorised to true
    } else if (service.isFlagged === true) {
      return { ...service, isAuthorised: false };
    }
    return service;
  });

  //console.log(modifiedAgreedServices,'modifiedAgreedServices')
  const admissionObject = {
    student,
    admissionCreator,
    admissionOperator,
    admissionDate,
    admissionYear,
    agreedServices: modifiedAgreedServices,
  }; //construct new admission to be stored
  //set is authjorised for everfy isFLagged:false

  console.log(admissionObject.agreedServices, "modifiedAgreedServices");

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

      return res.status(201).json({
        message: `Admission and service created successfully`,
      });
    } else {
      return res.status(404).json({ message: "Not found" });
    }
  } else {
    return res.status(400).json({ message: "Invalid data received" });
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
  if (
    !admissionId ||
    !student ||
    !admissionDate ||
    !admissionYear ||
    !admissionOperator ||
    !agreedServices ||
    agreedServices?.length === 0
  ) {
    return res.status(400).json({ message: "Required data is missing" });
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
    return res.status(409).json({ message: "Duplicate Admission found" });
  }

  admission.admissionDate = admissionDate; //it will only allow updating properties that are already existant in the model
  admission.admissionOperator = admissionOperator;
  admission.agreedServices = agreedServices;

  const updatedAdmission = await admission.save(); //save method received when we did not include lean

  res.json({
    message: `Admission updated successfully`,
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
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the admission exist to delete?
  const admissionToDelete = await Admission.findById(id).exec();
  // Does the admission exist to delete?
  const result = await admissionToDelete.deleteOne();
  if (result.acknowledged) {
    const studentId = admissionToDelete.student; // Directly using the known student ID

    // Update the student to unset the admission field
    const studentUpdateResult = await Student.findOneAndUpdate(
      { _id: studentId, "studentYears.admission": admissionToDelete._id }, // Match the specific student and admission
      { $unset: { "studentYears.$.admission": "" } }, // Unset (remove) the admission field
      { new: true } // Return the updated document
    );

    if (studentUpdateResult) {
      const reply = `Deleted (${studentUpdateResult?.deletedCount}) admission and updated student successfully`;
      return res.json({message:reply});
    } else {
      return res
        .status(400)
        .json({ message: "Failed to update student admission." });
    }
  }

  // If failed to delete admission
  const reply = `Deleted ${result.deletedCount} admissions`;
  return res.status(400).json({message:reply});
});

module.exports = {
  getAllAdmissions,
  createNewAdmission,
  updateAdmission,
  deleteAdmission,
};
