const User = require("../models/User");
const Employee = require("../models/Employee");

const asyncHandler = require("express-async-handler"); //instead of using try catch
const bcrypt = require("bcrypt"); //to hash passwords before saving them
const mongoose = require("mongoose");


// @desc Get all employees, for the given year, if year is 1000 retreive all employees
// @route GET /hr/employees
// @access Private // later we will establish authorisations

//format for the scxheduler
const formatUsers = (users) => {
  return users
    .filter((user) => user.userRoles.includes("Animator"))
    .map((user) => {
      const {
        userFullName: { userFirstName, userMiddleName, userLastName },
        employeeData: { employeeColor },
        ...rest
      } = user;

      const fullName = [userFirstName, userMiddleName, userLastName]
        .filter(Boolean) // Remove any undefined or empty names
        .join(" ");

      // Remove unwanted fields
      const {
        userAddress,
        userContact,
        userDob,
        cin,
        userPhoto,
        userRoles,
        userSex,
        employeeData,
        ...filteredUser
      } = rest;

      return {
        ...filteredUser,
        userFullName: fullName, // Flattened full name
        employeeColor, // Move employeeColor to the root level
      };
    });
};

const getAllEmployees = asyncHandler(async (req, res) => {
  const { selectedYear, criteria, id } = req.query; //maybe replace the conditionals with the current year that we get  from middleware
  if (selectedYear) {
    //console.log(selectedYear, "sleected year inback");
    //will retrive all teh students
    if (selectedYear === "1000") {
      // Aggregation pipeline to retrieve users with matching employeeYears.academicYear
      const users = await User.aggregate([
        {
          // Stage 1: Match users that have a non-empty employeeId field
          $match: {
            employeeId: { $ne: null }, // Ensures employeeId is not null
          },
        },
        {
          // Stage 2: Lookup to populate employeeId with Employee data
          $lookup: {
            from: "employees", // Collection name of Employee
            localField: "employeeId", // Field in User schema
            foreignField: "_id", // Field in Employee schema
            as: "employeeData", // Alias for populated data
          },
        },
        {
          // Stage 3: Unwind the employeeData array to convert it into an object
          $unwind: {
            path: "$employeeData",
            preserveNullAndEmptyArrays: false, // Ensure users without employee data are excluded
          },
        },
        {
          // Stage 4: Add employeeId field directly from employeeData._id
          $addFields: {
            "employeeData.employeeId": "$employeeData._id", // Rename _id to employeeId in employeeData
          },
        },
        {
          // Stage 5: Optional - Project to return only the necessary fields
          $project: {
            _id: 1,
            userFullName: 1,
            userDob: 1,
            userSex: 1,
            cin: 1,
            userPhoto: 1,
            userAddress: 1,
            userRoles: 1,
            userContact: 1,
            employeeId: 1, // User's original employeeId reference
            "employeeData.employeeId": 1, // New employeeId from Employee data
            "employeeData.employeeCurrentEmployment": 1,
            "employeeData.employeeIsActive": 1,
            "employeeData.employeeColor": 1,
            "employeeData.employeeAssessment": 1,
            "employeeData.employeeWorkHistory": 1,
            "employeeData.employeeYears": 1,
          },
        },
      ]);

      if (!users?.length) {
        return res.status(400).json({ message: "No employees found!" });
      }
      if (users) {
        console.log(users, "users");
        return res.status(200).json(users);
      }
    }
    if (selectedYear !== "1000") {
      //will retrieve only the employees for the selcted year

      // Aggregation pipeline to retrieve users with matching employeeYears.academicYear
      const users = await User.aggregate([
        {
          // Stage 1: Lookup to populate employeeId with Employee data
          $lookup: {
            from: "employees", // Collection name of Employee
            localField: "employeeId", // Field in User schema
            foreignField: "_id", // Field in Employee schema
            as: "employeeData", // Alias for populated data
          },
        },
        {
          // Stage 2: Unwind the employeeData array to convert it into an object
          $unwind: {
            path: "$employeeData",
            preserveNullAndEmptyArrays: false, // Ensure users without employee data are excluded
          },
        },
        {
          // Stage 3: Unwind the employeeYears array in employeeData to flatten it
          $unwind: {
            path: "$employeeData.employeeYears",
            preserveNullAndEmptyArrays: false, // Allow employees without years to be included
          },
        },
        {
          // Stage 4: Match only employees whose employeeYears array contains the selectedYear
          $match: {
            "employeeData.employeeYears.academicYear": selectedYear, // Match the selected year
          },
        },
        {
          // Stage 5: Group to collect all employeeYears back into an array without filtering
          $group: {
            _id: "$_id",
            userFullName: { $first: "$userFullName" },
            userDob: { $first: "$userDob" },
            userSex: { $first: "$userSex" },
            cin: { $first: "$cin" },
            userPhoto: { $first: "$userPhoto" },
            userRoles: { $first: "$userRoles" },
            userAddress: { $first: "$userAddress" },
            userContact: { $first: "$userContact" },
            employeeId: { $first: "$employeeId" },
            employeeData: {
              $first: {
                employeeCurrentEmployment:
                  "$employeeData.employeeCurrentEmployment",
                employeeIsActive: "$employeeData.employeeIsActive",
                employeeColor: "$employeeData.employeeColor",
                employeeAssessment: "$employeeData.employeeAssessment",
                employeeWorkHistory: "$employeeData.employeeWorkHistory",
              },
            },
            // Collect all employeeYears into a single array
            employeeYears: { $push: "$employeeData.employeeYears" }, // Rebuild the employeeYears array
          },
        },
        {
          // Stage 6: Add employeeYears back into employeeData
          $addFields: {
            "employeeData.employeeYears": "$employeeYears", // Move the employeeYears array into employeeData
          },
        },
        {
          // Stage 7: Project the final shape of the document
          $project: {
            _id: 1,
            userFullName: 1,
            userDob: 1,
            userSex: 1,
            cin: 1,
            userPhoto: 1,
            userAddress: 1,
            userRoles: 1,
            userContact: 1,
            employeeId: 1,
            "employeeData.employeeCurrentEmployment": 1,
            "employeeData.employeeIsActive": 1,
            "employeeData.employeeColor": 1,
            "employeeData.employeeAssessment": 1,
            "employeeData.employeeWorkHistory": 1,
            "employeeData.employeeYears": 1, // Include employeeYears inside employeeData
          },
        },
      ]);
      // Check if any users were found
      if (users.length === 0) {
        return res
          .status(404)
          .json({ message: "No users found with the selected year." });
      }

      if (criteria === "Animator") {
        // flatten the name , keep only Animators and arrange for scheduler

        const formattedUsers = formatUsers(users);

        return res.status(200).json(formattedUsers);
      } else {
        // Return the filtered users
        res.status(200).json(users);
      }
    }
  }
  if (id) {
    // Aggregation pipeline to retrieve a specific user by employeeId and matching selected academic year
    console.log(id);
    const user = await User.findOne({ _id: id }).populate("employeeId").lean(); //chnaged to user instead of employee

    if (!user) {
      return res
        .status(404)
        .json({ message: "No employee found with the provided id." });
    }
    return res.status(200).json(user);
  }
});

//----------------------------------------------------------------------------------
//@desc Create new employee, first save employee and then use employee id to save user
//@route POST /hr/employees
//@access Private
//first we save the studentsm then employee then user
const createNewEmployee = asyncHandler(async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "No Data received" });
  }

  const {
    userFullName,
    username,
    password,
    userSex,
    cin,
    userDob,
    userAllowedActions,
    userRoles,
    userIsActive,
    userAddress,
    userContact,
    employeeCurrentEmployment,
    employeeIsActive,
    employeeYears,
    employeeWorkHistory,
    employeeAssessment,
  } = req?.body; //this will come from front end we put all the fields ofthe collection here
  console.log(employeeCurrentEmployment, "employeeCurrentEmployment");
  //Confirm data for employee is present in the request with all required fields, data for user will be checked by the user controller
  if (
    !userFullName.userFirstName ||
    !userFullName.userLastName ||
    !username ||
    !password ||
    !userSex ||
    !cin ||
    !userDob ||
    !userRoles.length > 0 ||
    !userAddress.house ||
    !userAddress.street ||
    !userAddress.city ||
    !userContact.primaryPhone ||
    !employeeCurrentEmployment.contractType ||
    !employeeCurrentEmployment.position ||
    !employeeCurrentEmployment.joinDate ||
    !employeeCurrentEmployment.salaryPackage.basic ||
    !employeeYears.length > 0
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }
  // Check for duplicate employee by checking duplicate fullname, but we can have a returning employee, we will later check the dates of entry and departure to update them properly
  // const duplicateemployee = await User.findOne({ userFullName: userFullName }).lean().exec()
  // if (duplicateemployee) {
  //     return res.status(409).json({ message: `Duplicate employee name found:${duplicateemployee.userFullName.userFirstName} ` })//get the  name from  collection
  // }

  // Check for duplicate username
  const duplicateUsername = await User.findOne({ username }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateUsername) {
    //we will later check if the duplicate has isEmployee and then call the update Employee method
    return res.status(409).json({ message: "Duplicate username found" });
  }
  // Check for duplicate CIN
  const duplicateCin = await User.findOne({ cin }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateCin) {
    
    return res.status(409).json({ message: "Duplicate CIN found" });
  }

  // Check for duplicate userFullName
  const duplicateFullName = await User.findOne({ userFullName }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateFullName) {
    return res.status(409).json({ message: "Duplicate full name found" });
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt roundsm we will implement it laterm normally password is without''

  //prepare new employee to be stored
  //get the employeeId to store it with user
  //const createdUserId = await User.findOne({username }).lean()/////////////////////
  ///const parentUserId= createdUserId._id/////////
  const employeeObject = {
    employeeCurrentEmployment,
    employeeIsActive,
    employeeYears,
    employeeWorkHistory,
    employeeAssessment,
  }; //construct new employee to be stored

  //  store new employee
  const savedEmployee = await Employee.create(employeeObject);

  if (savedEmployee) {
    //if created we will create the emmployee inside the if statement
    // res.status(201).json({ message: `New user ${username} created` })

    // get id from recent document
    // Find the most recent document based on _id

    // Create and store new user
    //const createdEmployee = await Employee.findOne({_id:id }).lean()
    const employeeId = savedEmployee._id;
    console.log(employeeId, "saved  employeeId");

    const userObject = {
      userFullName,
      username,
      password: hashedPwd,
      userSex,
      cin,
      userDob,
      userAllowedActions,
      userIsActive,
      userRoles,
      userAddress,
      userContact,
      employeeId,
    }; //construct new user to be stored

    const savedUser = await User.create(userObject);

    if (savedUser) {
      //if created

      //the following line res is not being executed and was causing the error [ERR_HTTP_HEADERS_SENT, now we send both res for user and parent  together in ne line
      return res.status(201).json({
        message: `User ${username + ","} and employee ${
          userFullName.userFirstName +
          " " +
          userFullName.userMiddleName +
          " " +
          userFullName.userLastName +
          ","
        } created successfully`,
      });
    } else {
      //delete the user already craeted to be done

      return res.status(400).json({ message: "Invalid data received" });
    }
  } else {
    res.status(400).json({ message: "Invalid data received" });
  }
}); //we need to delete the user if the parent is not saved

const getEmployeeDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Aggregation to lookup Employee within User
  const result = await User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(userId) }, // Match the user by ID
    },
    {
      $lookup: {
        from: "employees", // Collection name of Employee
        localField: "employeeId", // Field in User
        foreignField: "_id", // Field in Employee
        as: "employeeDetails", // Output array field
      },
    },
    {
      $unwind: { path: "$employeeDetails", preserveNullAndEmptyArrays: true }, // Optional if no employee is associated
    },
  ]);

  if (result.length === 0) {
    return res.status(404).json({ message: "User or Employee not found" });
  }

  res.status(200).json(result[0]); // Sending the aggregated result
});
////////////////////////////////////////////////////////////////////
module.exports = {
  getEmployeeDetails,
};

// @desc Update a employee, we will retrieve all information from user and parent and update and save in both collections
// @route PATCH /hr/employees
// @access Private
const updateEmployee = asyncHandler(async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "No Data received" });
  }

  const {
    userId,
    employeeId,
    userFullName,
    userSex,
    cin,
    userDob,
    userRoles,
    userAddress,
    userContact,
    employeeCurrentEmployment,
    employeeIsActive,
    employeeYears,
    employeeWorkHistory,
    employeeAssessment,
  } = req?.body; //this will come from front end we put all the fields ofthe collection here

  // console.log(
  //   userId,
  //   employeeId,
  //   userFullName,
  //   userSex,
  //   cin,
  //   userDob,
  //   userRoles,
  //   userAddress,
  //   userContact,
  //   employeeCurrentEmployment,
  //   employeeIsActive,
  //   employeeYears,
  //   employeeWorkHistory,
  //   employeeAssessment
  // );
  //Confirm data for employee is present in the request with all required fields, data for user will be checked by the user controller
  if (
    !userId ||
    !userFullName.userFirstName ||
    !userFullName.userLastName ||
    !userSex ||
    !cin ||
    !userDob ||
    !userRoles.length > 0 ||
    !employeeId ||
    !userAddress.house ||
    !userAddress.street ||
    !userAddress.city ||
    !userContact.primaryPhone ||
    !employeeCurrentEmployment.contractType ||
    !employeeCurrentEmployment.position ||
    !employeeCurrentEmployment.joinDate ||
    !employeeCurrentEmployment.salaryPackage.basic ||
    !employeeYears.length > 0
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }

  //no need to check for duplicate username because it was not edited in empoloyee edit

  // Does the user exist to update?
  const user = await User.findById(userId).exec(); //we did not lean because we need the save method attached to the response

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  const employee = await Employee.findById(employeeId).exec(); //find the parent with the id from the user
  if (!employee) {
    return res.status(400).json({ message: "Employee not found" });
  }

  user.userFullName = userFullName; //it will only allow updating properties that are already existant in the model
  user.userRoles = userRoles;
  user.employeeId = employeeId;
  user.userSex = userSex;
  user.cin = cin;
  user.userDob = userDob;
  user.userRoles = userRoles;
  //user.userPhoto = userPhoto;
  user.userAddress = userAddress;
  user.userContact = userContact;
  employee.employeeCurrentEmployment = employeeCurrentEmployment;
  employee.employeeAssessment = employeeAssessment;
  employee.employeeWorkHistory = employeeWorkHistory;
  employee.employeeIsActive = employeeIsActive;
  employee.employeeYears = employeeYears;

  const updatedUser = await user.save(); //save method received when we did not include lean

  // res.json({ message: `${updatedUser.username} updated` })

  if (updatedUser) {
    const updatedEmployee = await employee.save();

    if (updatedEmployee) {
      res.json({
        message: `User and employee updated successfully`,
      }); //change parentYear later to show the parent full name
    } else {
      //delete the user already craeted to be done later

      res.status(400).json({ message: "Invalid data received" });
    }
  } else {
    res.status(400).json({ message: "Invalid data received" });
  }
});

//--------------------------------------------------------------------------------------1
// @desc Delete a parent, if no isEmployee, then delete the user orelse delete only parent and keep its user, if students are active dont delete
// @route DELETE /hr/employees
// @access Private
const deleteEmployee = asyncHandler(async (req, res) => {
  //uses parent id
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the parent still have assigned active students?
  // const student = await Student.findOne({ parent: id }).lean().exec()
  // if (student) {
  //     return res.status(400).json({ message: 'Parent has assigned active students' })//to be checked later
  // }

  // Does the parent exist to delete?
  // const user = await User.findOne({ isEmployee: id });

  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(400).json({ message: "corresponding User not found" });
  }
  const employee = await Employee.findById(user?.employeeId).exec();

  if (!employee) {
    return res.status(400).json({ message: "Employeee not found" });
  }
  //if user is also an parent, delete only the employee collection and keep user
  if (user.isParent) {
    const result1 = await employee.deleteOne();
    const reply = `Deleted ${result1?.deletedCount} Employee`;
    res.json({ message: reply });
  } else {
    const result1 = await employee.deleteOne();
    const result2 = await user.deleteOne();
    console.log(result2);

    const reply = `Deleted ${result2?.deletedCount} user and  ${result1?.deletedCount} employee `;

    res.json({ message: reply });
  }
});
module.exports = {
  getAllEmployees,
  createNewEmployee,
  updateEmployee,
  deleteEmployee,
};
