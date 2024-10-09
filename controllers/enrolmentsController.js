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
      //console.log("with yearrrrrrrrrrrrrrrrrrr select", selectedYear);
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
        path: "admission",
        select: "-admissionCreator -admissionOperator -student -updatedAt",
        populate: {
            path: "agreedServices.service",
            select: "-serviceAnchor -serviceCreator -serviceOperator",
        },
    })
    .lean();

console.log("Fetched Enrolments:", enrolments); // Debug log




// Assuming `enrolments` is your array of enrolment objects
const filteredEnrolments = enrolments.map(enrolment => {
  // Filter agreedServices based on the condition
  const filteredAgreedServices = enrolment.admission.agreedServices.filter(serviceObj => 
      (serviceObj.service._id.toString() === enrolment.service._id.toString()
      && serviceObj.feeMonths.includes(enrolment.enrolmentMonth))
  );

  // Return a new enrolment object with the filtered agreedServices
  return {
      ...enrolment,
      admission: {
          ...enrolment.admission,
          agreedServices: filteredAgreedServices[0],//we suppose we only have one match//////
      }
  };
});





    //  console.log(
    //     "with yeaaaaaaaaaaaaaaaaaar select",
    
    //     transformedEnrolments
    //   );
      if (!filteredEnrolments?.length) {
        return res.status(400).json({
          message: "No enrolments found for the selected academic year",
        });
      }
      return res.json(filteredEnrolments);
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
const createNewEnrolment = asyncHandler(async (req, res) => {//generate an invoice automatically with each new enrolment
  //console.log(req.body,'request body')

  const {
    student,
    admission,
    enrolmentCreator,
    enrolmentOperator,
    enrolmentYear,
    enrolmentMonth,
    enrolments,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here
  //console.log(enrolmentName, enrolmentDob,  enrolmentSex, enrolmentIsActive, enrolmentYears, enrolmentGardien, enrolmentEducation, lastModified)
  //Confirm data is present in the request with all required fields
  if (
    !student ||
    !enrolmentCreator ||
    !enrolmentOperator ||
    !admission ||
    !enrolmentYear ||
    !enrolmentMonth ||
    !Array.isArray(enrolments) ||
    enrolments.length===0
  ) {
    return res.status(400).json({ message: "All fields are required" }); //400 : bad request
  }

  // Iterate through the enrolments array and process each enrolment object
  const enrolmentPromises = enrolments.map(async (enrolment) => {
    const { service, serviceType, servicePeriod, serviceAuthorisedFee, serviceFinalFee } = enrolment;

    // Check for duplicates: check if an enrolment already exists for the same student, admission, service, and servicePeriod
    const existingEnrolment = await Enrolment.findOne({
      student,
      admission,
      service,
      serviceType,
      enrolmentMonth,
      enrolmentYear
    });

    if (existingEnrolment) {
      return { error: `Duplicate enrolment for service: ${serviceType} in period: ${enrolmentMonth} ${enrolmentYear}` };
    }

    // Create new enrolment object
    const newEnrolment = new Enrolment({
      student,
      admission,
      service,
      serviceType,
      servicePeriod,
      serviceAuthorisedFee,
      serviceFinalFee,
      enrolmentYear,
      enrolmentMonth,
      enrolementCreator: enrolmentCreator,
      enrolementOperator: enrolmentOperator,
    });

    // Save enrolment and handle errors
    try {
      const savedEnrolment = await newEnrolment.save();
      return savedEnrolment;
    } catch (error) {
      return { error: `Error saving enrolment for service: ${serviceType}, Error: ${error.message}` };
    }
  });

  // Wait for all enrolments to process
  const savedEnrolments = await Promise.all(enrolmentPromises);

  // Filter out enrolments that encountered errors and return a response
  const errors = savedEnrolments.filter((enrolment) => enrolment.error);
  const successfulEnrolments = savedEnrolments.filter((enrolment) => !enrolment.error);

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Some enrolments encountered errors",
      errors,
    });
  }

  return res.status(201).json({
    message: "Enrolments successfully created",
    enrolments: successfulEnrolments,
  });
});

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
