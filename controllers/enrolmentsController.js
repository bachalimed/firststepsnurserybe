// const User = require('../models/User')
const Enrolment = require("../models/Enrolment"); //we might need the parent module in this controller
const Student = require("../models/Student");
const Service = require("../models/Service"); //we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");




/**
 * Function to get enrolment statistics by month, including service types and trends.
 * @param {Number} selectedYear - The selected academic year to filter enrolments.
 */
const getEnrolmentStatisticsByMonth = async (selectedYear) => {
  try {
    // Retrieve enrolments that match the selected year
    const enrolmentsAggregation = await Enrolment.aggregate([
      {
        $match: {
          enrolmentYear: selectedYear, // Filter by the selected academic year
        },
      },
      {
        $group: {
          _id: { month: "$enrolmentMonth" }, // Group by enrolmentMonth
          enrolmentsNumber: { $sum: 1 }, // Count total enrolments per month
          serviceTypes: {
            $push: "$serviceType", // Collect all service types in the month
          },
        },
      },
      {
        $sort: {
          "_id.month": 1, // Sort by month (January to December)
        },
      },
    ]);

    // Initialize the result array and service type trend tracker
    const monthlyStats = [];
    const nextServiceTypeCounts = {}; // Tracks the service type counts for the next month

    // Helper function to calculate the trend percentage
    const calculateTrend = (current, next) => {
      if (next === 0) return current > 0 ? 100 : 0; // Avoid division by zero
      return ((next - current) / current) * 100;
    };

    // Iterate through the aggregation result to structure the data
    enrolmentsAggregation.forEach((entry, index) => {
      const { month } = entry._id;
      const enrolmentsNumber = entry.enrolmentsNumber;

      // Count occurrences of each service type in the month
      const serviceTypeCount = entry.serviceTypes.reduce((acc, serviceType) => {
        acc[serviceType] = (acc[serviceType] || 0) + 1;
        return acc;
      }, {});

      // Calculate trends for each service type by comparing to the next month
      const serviceTypeTrends = {};
      for (const serviceType in serviceTypeCount) {
        const currentCount = serviceTypeCount[serviceType];
        const nextCount = nextServiceTypeCounts[serviceType] || 0;
        serviceTypeTrends[serviceType] = Math.round(calculateTrend(currentCount, nextCount));

        // Update nextServiceTypeCounts for the next iteration
        nextServiceTypeCounts[serviceType] = currentCount;
      }

      // Add the structured data to the monthly stats array
      monthlyStats.push({
        month,
        enrolmentsNumber,
        serviceTypes: serviceTypeCount,
        serviceTypeTrends, // Trends for each service type compared to the next month
      });
    });

    // Return the statistics
    return monthlyStats;
  } catch (error) {
    console.error("Error retrieving enrolment statistics:", error);
    throw error;
  }
};
















// @desc Get all enrolments
// @route GET 'enrolments/enrolmentsParents/enrolments
// @access Private // later we will establish authorisations
const getAllEnrolments = asyncHandler(async (req, res) => {
  // Check if the request has selectedYear or id query parameters
  //console.log('getting the query', req.query)
  const { selectedYear, id, selectedMonth, criteria } = req.query;
 
  if (id) {
    // Fetch enrolment by ID
    // const { id } = req.query;
    const enrolment = await Enrolment.find({ _id: id })
      .populate("student")
      .lean();
    //console.log('admssion with id', enrolment)
    if (!enrolment) {
      return res
        .status(400)
        .json({ message: "No enrolment found for the provided Id" });
    }
    return res.json(enrolment);
  }
  if (selectedYear === "1000") {
    // Fetch all enrolments if selectedYear is '1000'
    const enrolments = await Enrolment.find().lean();
    if (!enrolments?.length) {
      return res.status(400).json({ message: "No enrolments found!" });
    }
    return res.json(enrolments);
  }

  if (selectedYear !== "1000" && selectedMonth) {
    //newInvoiceform
    const enrolments = await Enrolment.find({
      enrolmentYear: selectedYear,
      enrolmentMonth: selectedMonth,
    })
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
      .populate("enrolmentInvoice")
      .lean();

    //console.log("Fetched Enrolments:", enrolments); // Debug log

    // Assuming `enrolments` is your array of enrolment objects
    const filteredEnrolments = enrolments.map((enrolment) => {
      // Filter agreedServices based on the condition
      const filteredAgreedServices = enrolment.admission.agreedServices.filter(
        (serviceObj) =>
          serviceObj.service._id.toString() ===
            enrolment.service._id.toString() &&
          serviceObj.feeMonths.includes(enrolment.enrolmentMonth)
      );

      // Return a new enrolment object with the filtered agreedServices
      return {
        ...enrolment,
        admission: {
          ...enrolment.admission,
          agreedServices: filteredAgreedServices[0], //we suppose we only have one match//////
        },
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
  if (selectedYear !== "1000" && criteria === "UnpaidInvoices") {

    console.log("weeeeeeeeeeeeeeeeeeeeeeeeeeee")
    //for newpaymentform to retrieve the studetn with unpaid invoices and their enrolments

    try {
      // Query enrolments for the selected year and populate related data
      const enrolments = await Enrolment.find({
        enrolmentYear: selectedYear,
      })
        .populate({
          path: "student",
          select: "studentName _id", // Populate student to get studentName and _id
        })
        .populate({
          path: "enrolmentInvoice", // Populate the related invoice
        })
        .lean();
  
      // Filter enrolments to only include those with fully paid invoices
      const filteredEnrolments = enrolments.filter(
        (enrolment) => enrolment.enrolmentInvoice?.invoiceIsFullyPaid === false
      );
  
      // Restructure data by grouping enrolments by student
      const groupedByStudent = {};
  
      filteredEnrolments.forEach((enrolment) => {
        const _id = enrolment.student._id.toString();
        const studentName = enrolment.student.studentName;
  
        // Initialize the student group if it doesn't exist
        if (!groupedByStudent[_id]) {
          groupedByStudent[_id] = {
            _id,
            studentName,
            enrolments: [],
          };
        }
  
        // Add the enrolment to the student's enrolments array without the `enrolmentInvoice` field
        const { enrolmentInvoice, ...enrolmentDataWithoutInvoice } = enrolment;
  
        // Include only the necessary invoice data under `invoice`
        groupedByStudent[_id].enrolments.push({
          ...enrolmentDataWithoutInvoice,
          invoice: enrolmentInvoice, // Attach the invoice data
        });
      });
  
      // Convert the grouped object to an array format
      const result = Object.values(groupedByStudent);
  
      // Return the result
      return res.json(result);
    } catch (error) {
      console.error("Error retrieving enrolments:", error);
      return res.status(500).json({ message: "Error retrieving enrolments" });
    }
  }
//////////////////////////////////////////////////////////////////////////////////////////
  if (selectedYear !== "1000" &&criteria==="enrolmentsTotalStats") {

    try {
      // Wait for the `countStudents` function to resolve
    const monthlyStats = await getEnrolmentStatisticsByMonth(selectedYear);
//console.log(monthlyStats,'monthlyStats')
    // Check if all counts are missing or zero
    if (
      !monthlyStats
    ) {
      return res
        .status(400)
        .json({ message: "No enrolments Stats found for the selected Year provided" });
    }

    // If counts are valid, return them in the response
    return res.json({
      monthlyStats
    });
  } catch (error) {
    console.error("Error fetching monthly Stats :", error);
    return res
      .status(500)
      .json({ message: "Error retrieving enrolment data", error });
  }



  }



//////////////////////////////////////////////////////////////////////////////////////////////////////

  if (selectedYear !== "1000") {
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
      .populate("enrolmentInvoice")
      .lean();

    //console.log("Fetched Enrolments:", enrolments); // Debug log

    // Assuming `enrolments` is your array of enrolment objects
    const filteredEnrolments = enrolments.map((enrolment) => {
      // Filter agreedServices based on the condition
      const filteredAgreedServices = enrolment.admission.agreedServices.filter(
        (serviceObj) =>
          serviceObj.service._id.toString() ===
            enrolment.service._id.toString() &&
          serviceObj.feeMonths.includes(enrolment.enrolmentMonth)
      );

      // Return a new enrolment object with the filtered agreedServices
      return {
        ...enrolment,
        admission: {
          ...enrolment.admission,
          agreedServices: filteredAgreedServices[0], //we suppose we only have one match//////
        },
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
  else {
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
  //generate an invoice automatically with each new enrolment
  //console.log(req.body,'request body')

  const {
    student,
    admission,
    enrolmentCreator,
    enrolmentOperator,
    enrolmentYear,
    enrolmentMonth,
    enrolmentNote,
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
    enrolments.length === 0
  ) {
    return res.status(400).json({ message: "All fields are required" }); //400 : bad request
  }

  // Iterate through the enrolments array and process each enrolment object
  const enrolmentPromises = enrolments.map(async (enrolment) => {
    const {
      service,
      serviceType,
      servicePeriod,
      serviceAuthorisedFee,
      serviceFinalFee,
    } = enrolment;

    // Check for duplicates: check if an enrolment already exists for the same student, admission, service, and servicePeriod
    const existingEnrolment = await Enrolment.findOne({
      student,
      admission,
      service,
      serviceType,
      enrolmentMonth,
      enrolmentYear,
    });

    if (existingEnrolment) {
      return {
        error: `Duplicate enrolment for service: ${serviceType} in period: ${enrolmentMonth} ${enrolmentYear}`,
      };
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
      enrolmentNote,
      enrolmentCreator: enrolmentCreator,
      enrolmentOperator: enrolmentOperator,
    });

    // Save enrolment and handle errors
    try {
      const savedEnrolment = await newEnrolment.save();
      return savedEnrolment;
    } catch (error) {
      return {
        error: `Error saving enrolment for service: ${serviceType}, Error: ${error.message}`,
      };
    }
  });

  // Wait for all enrolments to process
  const savedEnrolments = await Promise.all(enrolmentPromises);

  // Filter out enrolments that encountered errors and return a response
  const errors = savedEnrolments.filter((enrolment) => enrolment.error);
  const successfulEnrolments = savedEnrolments.filter(
    (enrolment) => !enrolment.error
  );

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
    //enrolmentDate,
    enrolmentYear,
    enrolmentMonth,
    enrolmentNote,
    enrolmentOperator,
    service,
    serviceFinalFee,
    enrolmentSuspension,
  } = req.body;
  //console.log(req.body);
  // Confirm data
  if (
    !enrolmentId ||
    !student ||
    !enrolmentMonth ||
    //!enrolmentDate ||

    !enrolmentYear ||
    !enrolmentOperator ||
    !service ||
    !serviceFinalFee
    
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Does the enrolment exist to update?
  const enrolment = await Enrolment.findById(enrolmentId).exec(); //we did not lean becausse we need the save method attached to the response

  if (!enrolment) {
    return res.status(400).json({ message: "Enrolment not found" });
  }

  
  enrolment.serviceFinalFee = serviceFinalFee; //it will only allow updating properties that are already existant in the model
  enrolment.enrolmentOperator = enrolmentOperator;
  enrolment.enrolmentNote = enrolmentNote;
  enrolment.enrolmentSuspension = enrolmentSuspension;

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
  //console.log(result, "result");
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
