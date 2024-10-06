// const User = require('../models/User')
const Enrolment = require("../models/Enrolment"); //we might need the parent module in this controller
const Student = require("../models/Student");
const Service = require("../models/Service"); //we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all enrolments
// @route GET 'enrolments/enrolmentsParents/enrolments
// @access Private // later we will establish authorisations
const getAllEnrolments = asyncHandler(async (req, res) => {
  // Check if the request has selectedYear or id query parameters
  //console.log('getting the query', req.query)
  if (req.query.selectedYear) {
    const { selectedYear } = req.query;

    if (selectedYear === "1000") {
      // Fetch all enrolments if selectedYear is '1000'
      const enrolments = await Enrolment.find().lean();
      if (!enrolments?.length) {
        return res.status(400).json({ message: "No enrolments found!" });
      }
      return res.json(enrolments);
    } else {
      // Fetch enrolments for the selected year
      console.log("with yearrrrrrrrrrrrrrrrrrr select", selectedYear);
      //const enrolments = await Enrolment.find()
      // const enrolments = await Enrolment.find({ enrolmentYear: selectedYear })
      //   .populate("student", "-studentDob -studentEducation -operator -studentGardien") // Exclude these fields
      //   //.populate("service", "-serviceAnchor -serviceCreator -serviceOperator")
      //   .populate("admission", "-admissionCreator -admissionOperator")
      //   .lean();

      const enrolments = await Enrolment.find({ enrolmentYear: selectedYear })
        .populate(
          "student",
          "-studentDob -studentEducation -operator -studentGardien"
        )
        .populate("service", "-serviceAnchor -serviceCreator -serviceOperator")
        .populate({
          path: "admission", // Populate the admission field in enrolments
          select: "-admissionCreator -admissionOperator -student -updatedAt", // Exclude certain fields from admission
          populate: {
            path: "agreedServices.service", // Populate the service field within each agreedService
            select: "-serviceAnchor -serviceCreator -serviceOperator", // Exclude fields from service
          },
        })
        .lean(); // Convert Mongoose documents to plain JavaScript objects





// // Now we transform agreedServices from an array to a single object// this will not work for many services that have feeend date
// const transformedEnrolments = enrolments.map((enrolment) => {
//   const admission = enrolment.admission;
//   if (admission && admission.agreedServices && enrolment.service) {
//     // Find the matching agreedService where the service IDs match
//     const matchedService = admission.agreedServices.find(
//       (agreedService) => agreedService.service._id.toString() === enrolment.service._id.toString()
//     );

//     // If a matching agreedService is found, replace agreedServices array with a single object
//     if (matchedService) {
//       admission.agreedServices = matchedService; // Now agreedServices is an object
//     } else {
//       // If no match is found, set agreedServices to null or an empty object
//       admission.agreedServices = null;
//     }
//   }
//   return enrolment;
// });

// Transform agreedServices from an array to a single object
const transformedEnrolments = enrolments.map((enrolment) => {
  const admission = enrolment.admission;
  if (admission && admission.agreedServices && enrolment.service) {
    // Filter matching agreedServices where service IDs match
    const matchedServices = admission.agreedServices.filter(
      (agreedService) =>
        agreedService.service._id.toString() === enrolment.service._id.toString()
    );

    // Prioritize agreedService that has no feeEndDate or feeEndDate is empty string
    const matchedService = matchedServices.find(
      (agreedService) => !agreedService.feeEndDate || agreedService.feeEndDate === ""
    ) || matchedServices[0]; // Fallback to the first matched service if no such service

    // If a matching agreedService is found, replace agreedServices array with a single object
    if (matchedService) {
      admission.agreedServices = matchedService; // Now agreedServices is an object
    } else {
      // If no match is found, set agreedServices to null
      admission.agreedServices = null;
    }
  }
  return enrolment;
});

      console.log(
        "with yeaaaaaaaaaaaaaaaaaar select",
        selectedYear,
        transformedEnrolments
      );
      if (!transformedEnrolments?.length) {
        return res.status(400).json({
          message: "No enrolments found for the selected academic year",
        });
      }
      return res.json(transformedEnrolments);
    }
  } else if (req.query.id) {
    // Fetch enrolment by ID
    const { id } = req.query;
    const enrolment = await Enrolment.find({ _id: id })
      .populate("student")
      .lean();
    //console.log('admssion with id', enrolment)
    if (!enrolment?.length) {
      return res
        .status(400)
        .json({ message: "No enrolment found for the provided Id" });
    }
    return res.json(enrolment);
  } else {
    // Fetch all enrolments if no query parameters
    const enrolments = await Enrolment.find().lean();
    if (!enrolments?.length) {
      return res.status(400).json({ message: "No enrolments found" });
    }
    return res.json(enrolments);
  }
});

//----------------------------------------------------------------------------------
// @desc Create new user
// @route POST 'enrolments/enrolmentsParents/enrolments
// @access Private
const createNewEnrolment = asyncHandler(async (req, res) => {
  //console.log(req.body,'request body')

  const {
    student,
    enrolmentCreator,
    enrolmentOperator,
    enrolmentDate,
    enrolmentYear,
    agreedServices,
  } = req.body; //this will come from front end we put all the fields o fthe collection here
  //console.log(enrolmentName, enrolmentDob,  enrolmentSex, enrolmentIsActive, enrolmentYears, enrolmentGardien, enrolmentEducation, lastModified)
  //Confirm data is present in the request with all required fields
  if (
    !student ||
    !enrolmentCreator ||
    !enrolmentOperator ||
    !enrolmentDate ||
    !enrolmentYear ||
    !agreedServices
  ) {
    return res.status(400).json({ message: "All fields are required" }); //400 : bad request
  }

  // Check for duplicate
  const duplicate = await Enrolment.findOne({
    student, // Match the same student
    enrolmentYear, // Match the same enrolment year
    //'agreedServices.service': agreedServices?.service          // Match the agreedServices.service field
  })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({
      message: ` duplicate enrolment name for student ${duplicate.student} and service ${duplicate.agreedServices} `,
    });
  }

  const enrolmentObject = {
    student,
    enrolmentCreator,
    enrolmentOperator,
    enrolmentDate,
    enrolmentYear,
    agreedServices,
  }; //construct new enrolment to be stored

  // Create and store new enrolment
  const enrolment = await Enrolment.create(enrolmentObject);

  if (enrolment) {
    // Find the student by _id
    const studentToUpdateWithEnrolment = await Student.findOne({
      _id: student,
    });

    if (studentToUpdateWithEnrolment) {
      // Find the year object in studentYears that matches the enrolmentYear
      const studentYearToUpdate =
        studentToUpdateWithEnrolment.studentYears.find(
          (year) => year.academicYear === enrolment.enrolmentYear
        );

      // If the year is found, add the enrolment key with enrolment._id
      if (studentYearToUpdate) {
        studentYearToUpdate.enrolment = enrolment._id;
      }

      // Save the updated student document
      await studentToUpdateWithEnrolment.save();

      res.status(201).json({
        message: `New enrolment for student ${enrolment.student} and service ${enrolment.agreedServices} created`,
      });
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } else {
    res.status(400).json({ message: "Invalid enrolment data received" });
  }
});
//internalcontroller :CreateNew User to be used by other controllers??

// @desc Update a enrolment
// @route PATCH 'enrolments/enrolmentsParents/enrolments
// @access Private
const updateEnrolment = asyncHandler(async (req, res) => {
  const {
    enrolmentId,
    student,
    enrolmentDate,
    enrolmentYear,
    enrolmentOperator,
    agreedServices,
  } = req.body;
  console.log(req.body);
  // Confirm data
  if (
    !enrolmentId ||
    !student ||
    !enrolmentDate ||
    !enrolmentYear ||
    !enrolmentOperator ||
    !agreedServices ||
    agreedServices?.length === 0
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Does the enrolment exist to update?
  const enrolment = await Enrolment.findById(enrolmentId).exec(); //we did not lean becausse we need the save method attached to the response

  if (!enrolment) {
    return res.status(400).json({ message: "Enrolment not found" });
  }

  // Check for duplicate
  const duplicate = await Enrolment.findOne({ student }).lean().exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== enrolmentId) {
    return res.status(409).json({ message: "Duplicate Enrolment" });
  }

  enrolment.enrolmentDate = enrolmentDate; //it will only allow updating properties that are already existant in the model
  enrolment.enrolmentOperator = enrolmentOperator;
  enrolment.agreedServices = agreedServices;

  const updatedEnrolment = await enrolment.save(); //save method received when we did not include lean

  res.json({
    message: `enrolment ${updatedEnrolment._id}, updated`,
  });
});
//--------------------------------------------------------------------------------------1
// @desc Delete a enrolment
// @route DELETE 'enrolments/enrolmentsParents/enrolments
// @access Private
const deleteEnrolment = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Enrolment Id Required" });
  }

  // Does the user still have assigned notes?
  // const note = await Note.findOne({ user: id }).lean().exec()
  // if (note) {
  //     return res.status(400).json({ message: 'User has assigned notes' })
  // }

  // Does the user exist to delete?
  const enrolmentToDelete = await Enrolment.findById(id).exec();

  if (!enrolmentToDelete) {
    return res.status(400).json({ message: "Enrolment not found" });
  }

  const result = await enrolmentToDelete.deleteOne();
  console.log(result, "result");
  const reply = `confirm:  ${result} enrolment ${
    enrolmentToDelete.enrolmentName.firstName +
    " " +
    enrolmentToDelete.enrolmentName.middleName +
    " " +
    enrolmentToDelete.enrolmentName.lastName
  }, with ID ${enrolmentToDelete._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllEnrolments,
  createNewEnrolment,
  updateEnrolment,
  deleteEnrolment,
};
