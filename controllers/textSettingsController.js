//const TextSetting = require("../models/TextSetting");

const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all textSetting
// @route GET 'desk/textSetting
// @access Private // later we will establish authorisations
const getAllTextSettings = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;
  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

    // Find a single textSetting by its ID
    const textSetting = await TextSetting.findOne({ _id: id })
     
      .lean();

    if (!textSetting) {
      return res.status(400).json({ message: "TextSetting not found" });
    }

    // Return the textSetting inside an array
    return res.json([textSetting]); //we need it inside  an array to avoid response data error
  }
  if (selectedYear !== "1000") {
    // Find a single textSetting by its ID
    //console.log('here')
    const textSettings = await TextSetting.find().lean();

    if (!textSettings) {
      return res.status(400).json({ message: "TextSettings not found" });
    }

    // Return the textSetting inside an array
    return res.json(textSettings); //we need it inside  an array to avoid response data error
  }

  
  // If no ID is provided, fetch all textSettings
});

//----------------------------------------------------------------------------------
// @desc Create new textSetting
// @route POST 'desk/textSetting
// @access Private
const createNewTextSetting = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    textSettingLabel,
    textSettingPhone,
    textSettingAddress,
    textSettingNotes,
    textSettingIsActive,
    textSettingYears,
    //textSettingCategories,
    textSettingOperator,
    textSettingCreator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !textSettingLabel ||
    !textSettingIsActive ||
    !textSettingYears ||
    //!textSettingCategories ||
    !textSettingOperator ||
    !textSettingCreator
  ) {
    return res
      .status(400)
      .json({ message: "Required data is missing" }); //400 : bad request
  }

  // Check for duplicate textSetting or invoices paid previously
  const duplicate = await TextSetting.findOne({
    textSettingYears,
    textSettingLabel,
    //textSettingCategories,
  });

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate textSetting   ${duplicate.textSettingLabel}}`,
    });
  }

  const textSettingObject = {
    textSettingLabel: textSettingLabel,
    textSettingPhone: textSettingPhone,
    textSettingAddress: textSettingAddress,
    textSettingNotes: textSettingNotes,
    textSettingIsActive: textSettingIsActive,
    textSettingYears: textSettingYears,
    //textSettingCategories: textSettingCategories,
    textSettingOperator: textSettingOperator,
    textSettingCreator: textSettingCreator,
  }; //construct new textSetting to be stored

  // Create and store new textSetting
  const textSetting = await TextSetting.create(textSettingObject);
  if (!textSetting) {
    return res
      .status(400)
      .json({ message: "Invalid data received" });
  }
  // If created and students updated
  return res.status(201).json({
    message: `TextSetting  created successfully `,
  });
});

// @desc Update a textSetting
// @route PATCH 'desk/textSetting
// @access Private
const updateTextSetting = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that textSetting in any other, the latter will have an ending date
  const {
    id,
    textSettingLabel,
    textSettingPhone,
    textSettingAddress,
    textSettingNotes,
    textSettingIsActive,
    textSettingYears,
    //textSettingCategories,
    textSettingOperator,
  } = req?.body;

  // Confirm data
  if (
    !id ||
    textSettingIsActive === undefined || // Checks if isChangeFlag is undefined
    !textSettingLabel ||
    textSettingYears.length === 0 ||
    //textSettingCategories.length === 0 ||
    !textSettingOperator
  ) {
    return res.status(400).json({ message: "Required data is missing" });
  }
  
  // Does the textSetting exist to update?
  const textSettingToUpdate = await TextSetting.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!textSettingToUpdate) {
    return res.status(400).json({ message: "TextSetting to update not found" });
  }
 
  textSettingToUpdate.textSettingLabel=textSettingLabel
  textSettingToUpdate.textSettingPhone=textSettingPhone
  textSettingToUpdate.textSettingAddress=textSettingAddress
  textSettingToUpdate.textSettingNotes=textSettingNotes
  textSettingToUpdate.textSettingIsActive=textSettingIsActive
  textSettingToUpdate.textSettingYears=textSettingYears
  //textSettingToUpdate.textSettingCategories=textSettingCategories
  textSettingToUpdate.textSettingOperator=textSettingOperator


 
    //console.log(textSettingToUpdate,'textSettingToUpdate')
    const updatedTextSetting = await textSettingToUpdate.save(); //save old textSetting
    if (!updatedTextSetting) {
      return res.status(400).json({ message: "invalid data received" });
    }
      return res.status(201).json({
        message: `TextSetting updated successfully`,
      })

 

});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteTextSetting = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the user exist to delete?
  const textSetting = await TextSetting.findById(id).exec();

  if (!textSetting) {
    return res.status(400).json({ message: "TextSetting to delete not found" });
  }

  // Delete the textSetting
  const result = await textSetting.deleteOne();

  const reply = `Deleted ${result?.deletedCount} textSetting`;

  return res.json({message:reply});
});

module.exports = {
  getAllTextSettings,
  createNewTextSetting,
  updateTextSetting,
  deleteTextSetting,
};
