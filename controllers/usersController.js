const User = require("../models/User");
const Family = require("../models/Family"); //we might need the parent module in this controller
const Employee = require("../models/Employee"); //we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch
const bcrypt = require("bcrypt"); //to hash passwords before saving them
const mongoose = require("mongoose");

// @desc Get all users
// @route GET /admin/users              ??how to modify this route to admin/users is in serve.js and userRoutes
// @access Private // later we will establish authorisations
const getAllUsers = asyncHandler(async (req, res) => {
  const { id, criteria } = req.query;
  if (id && criteria === "userDetails") {
    // Get all users from MongoDB
    const user = await User.findById(id).select("-password").lean(); //this will not return the password or other extra data(lean)

    // If no users
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    return res.json(user);
  }

  if (id) {
    // Find the user by ID and select fields to exclude
    const user = await User.findById(id)
      .select(
        "-password -userAddress -userAllowedActions -userContact -userDob -userPhoto -userIsActive -userSex -username"
      )
      .populate({
        path: "employeeId",
        select:
          "-employeeAssessment -employeeCurrentEmployment -employeeWorkHistory -employeeYears",
      })
      .lean();

    // If no user is found, return error
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }
    if (!user.userRoles.includes("Animator"))
      return res
        .status(400)
        .json({ message: "No animators found forthe provided user ID" });
    // Extract and flatten properties as required
    const {
      userFullName: { userFirstName, userMiddleName, userLastName } = {},
      employeeId,
      _id,
      //...otherUserData
    } = user;

    // Combine the names into a single full name
    const fullName = [userFirstName, userMiddleName, userLastName]
      .filter(Boolean)
      .join(" ");

    // Build the final user object
    const formattedUser = {
      //...otherUserData,        // All other user properties
      _id: _id,

      userFullName: fullName, // Flattened full name
      employeeColor: employeeId?.employeeColor, // employeeColor at root level
      employeeId: employeeId?._id, // employee _id at root level
    };

    // Send the formatted response
    return res.json(formattedUser);
  }

  // Get all users from MongoDB
  const users = await User.find().select("-password").lean(); //this will not return the password or other extra data(lean)

  // If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No userss found" });
  }
  res.json(users);
});

//----------------------------------------------------------------------------------
// @desc Create new user
// @route POST /admin/usersManagement/newUser
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { formData } = req?.body;
  const {
    userFullName,
    username,
    password,
    userAllowedActions,
    userDob,
    userSex,
    familyId,
    employeeId,
    userIsActive,
    userRoles,
    userAddress,
    userContact,
  } = formData; //this will come from front end we put all the fields o fthe collection here

  //console.log(userFullName, username, password, isParent, isEmployee,  userDob, userIsActive, userRoles,  userAddress, userContact )
  //Confirm data is present in the request with all required fields
  if (
    !userFullName ||
    !username ||
    !userDob ||
    !userSex ||
    !password ||
    !userContact.primaryPhone ||
    !Array.isArray(userRoles)
  ) {
    return res.status(400).json({ message: "All fields are requiredd" }); //400 : bad request
  }

  // Check for duplicate username
  const duplicate = await User.findOne({ username }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  // Check for duplicate userFullName
  const duplicateName = await User.findOne({ userFullName }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateName) {
    return res.status(409).json({ message: "Duplicate Full name" });
  }

  //check the related parent or employee id from the DB

  // const userAlsoParent=  userRoles.includes('Parent')
  // const userAlsoEmployee=  userRoles.includes(!'Parent') && userRoles.length!==0
  // if (userAlsoParent){

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt roundsm we will implement it laterm normally password is without''

  const userObject = {
    userFullName,
    username,
    password: hashedPwd,
    userAllowedActions,
    familyId,
    employeeId,
    userDob,
    userSex,
    userIsActive,
    userRoles,
    userAddress,
    userContact,
  }; //construct new user to be stored

  // Create and store new user
  const user = await User.create(userObject);

  if (user) {
    //if created
    res.status(201).json({ message: `New user ${username} created` });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

// @desc Update a user
// @route PATCH /admin/usersManagement
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  //need te delete old photo??
  const { formData } = req?.body;
  const {
    id,
    oldPassword,
    newPassword1,
    userFullName,
    username,
    password,
    accessToken,
    userAllowedActions,
    familyId,
    employeeId,
    userDob,
    userSex,
    userIsActive,
    userPhoto,
    userRoles,
    userAddress,
    userContact,
    criteria,
  } = formData;

  if (criteria === "resetPassword") {
    if (!id || !oldPassword || !newPassword1) {
      return res.status(400).json({ message: "required fields are missing" });
    }
    const user = await User.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

 
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
//console.log(user,'user')
    // Check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec();

    // Allow updates to the original user
    if (duplicate && duplicate?._id.toString() !== id) {
      return res.status(409).json({ message: "Duplicate username found" });
    }

const passwordMatch = await bcrypt.compare(oldPassword, user.password)

    if (!passwordMatch) {
      return res.status(409).json({ message: "old password not matching" });
    }
    // Hash new password
 
    user.password = await bcrypt.hash(newPassword1, 10); // salt rounds
    const updatedUser = await user.save(); //save method received when we did not include lean
    //console.log(updatedUser);

    return res.json({ message: `${updatedUser?.username} updated` });
  }
  // normal user update
  if (
    !id ||
    !username ||
    !Array.isArray(userRoles) ||
    !userRoles.length ||
    typeof userIsActive !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "All fields except password are requireddd" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username }).lean().exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.userFullName = userFullName; //it will only allow updating properties that are already existant in the model
  user.username = username;
  user.userRoles = userRoles;
  user.userAllowedActions = userAllowedActions;
  user.accessToken = accessToken;

  user.familyId = familyId?.length === 24 ? familyId : undefined;
  user.employeeId = employeeId?.length === 24 ? employeeId : undefined;
  user.userDob = userDob;
  user.userSex = userSex;
  user.userIsActive = userIsActive;

  // user.userPhoto = userPhoto
  // user.userPhotoLabel = userPhotoLabel
  // user.userPhotoFormat = userPhotoFormat
  user.userAddress = userAddress;
  user.userContact = userContact;

  if (password) {
    //only if the password is requested to be updated
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }
  const updatedUser = await user.save(); //save method received when we did not include lean
  console.log(updatedUser);

  return res.json({ message: `${updatedUser.username} updated` });
});
//--------------------------------------------------------------------------------------1
// @desc Delete a user
// @route DELETE /admin/usersManagement
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  // Does the user still have assigned notes?
  // const note = await Note.findOne({ user: id }).lean().exec()
  // if (note) {
  //     return res.status(400).json({ message: 'User has assigned notes' })
  // }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${user.username} with ID ${user._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
