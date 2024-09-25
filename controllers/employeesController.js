const Employee = require("../models/Employee");
const User = require("../models/User"); //we might need the user controller with this model

// const studentController = require ('../controllers/studentsController')
// const Student = require ('../models/Student')
const asyncHandler = require("express-async-handler"); //instead of using try catch
const bcrypt = require("bcrypt"); //to hash passwords before saving them
const mongoose = require("mongoose");

// @desc Get all employees, for the given year, if year is 1000 retreive all employees
// @route GET /hr/employees
// @access Private // later we will establish authorisations
const getAllEmployees = asyncHandler(async (req, res) => {
  if (req.query.selectedYear) {
    const { selectedYear } = req.query; //maybe replace the conditionals with the current year that we get  from middleware
    //console.log(selectedYear, "sleected year inback")
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
            userPhoto: 1,
            userAddress: 1,
            userContact: 1,
            employeeId: 1, // User's original employeeId reference
            "employeeData.employeeId": 1, // New employeeId from Employee data
            "employeeData.employeeCurrentEmployment": 1,
            "employeeData.employeeIsActive": 1,
            "employeeData.employeeAssessment": 1,
            "employeeData.employeeWorkHistory": 1,
            "employeeData.employeeYears": 1,
          },
        },
      ]);
      
      
      if (!users?.length) {
        return res.status(400).json({ message: "No employees found!" });
      }
      if(users) {
        console.log(users,'users')
        return res.status(200).json(users)}
    } else {
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
          // Stage 3: Unwind the employeeYears array in employeeData
          $unwind: "$employeeData.employeeYears",
        },
        {
          // Stage 4: Match documents where employeeYears.academicYear equals selectedYear
          $match: {
            "employeeData.employeeYears.academicYear": selectedYear,
          },
        },
        {
          // Stage 5: Group the data and restructure employeeData
          $group: {
            _id: "$_id",
            userFullName: { $first: "$userFullName" },
            userDob: { $first: "$userDob" },
            userSex: { $first: "$userSex" },
            userPhoto: { $first: "$userPhoto" },
            userAddress: { $first: "$userAddress" },
            userContact: { $first: "$userContact" },
            employeeId: { $first: "$employeeId" },
            employeeData: {
              $first: {
                employeeCurrentEmployment: "$employeeData.employeeCurrentEmployment",
                employeeIsActive: "$employeeData.employeeIsActive",
                employeeAssessment: "$employeeData.employeeAssessment",
                employeeWorkHistory: "$employeeData.employeeWorkHistory",
              },
            },
            // Collect employeeYears into employeeData as a nested object
            employeeYears: { $push: "$employeeData.employeeYears" },
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
            userPhoto: 1,
            userAddress: 1,
            userContact: 1,
            employeeId: 1,
            'employeeData.employeeCurrentEmployment': 1,
            'employeeData.employeeIsActive': 1,
            'employeeData.employeeAssessment': 1,
            'employeeData.employeeWorkHistory': 1,
            'employeeData.employeeYears': 1, // Include employeeYears inside employeeData
          },
        },
      ]);
      
      
      
      
      // Check if any users were found
      if (users.length === 0) {
        return res
          .status(404)
          .json({ message: "No users found with the selected year." });
      }

      // Return the filtered users
      res.status(200).json(users);

      //will retreive according to the id
    }
    if (req.query.id) {
      const { id } = req.query;
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
          // Stage 2: Unwind employeeData array to make filtering possible
          $unwind: {
            path: "$employeeData",
            preserveNullAndEmptyArrays: true, // Optional: use this if some users might not have associated employees
          },
        },
        {
          // Stage 3: Match documents based on specific criteria
          $match: {
            "employeeData._id": id, // Match based on the _id field of employeeData
          },
        },
        {
          // Stage 4: Project fields if needed - this stage can be omitted if you want all fields
          // $project: {
          //   _id: 1,
          //   username: 1,
          //   userFullName: 1,
          //   employeeId: 1,
          //   "employeeData.emloyeeJoinDate": 1,
          //   "employeeData.employeeContractType": 1,
          //   "employeeData.employeeSalary": 1,
          //   "employeeData.employeeYears": 1,
          //   // Add other fields as necessary
          // },
        },
      ]);

      // Check if any users were found
      if (users.length === 0) {
        return res
          .status(404)
          .json({ message: "No users found with the selected year." });
      }

      // Return the filtered users
      res.status(200).json(users);
    }
  }
});

//----------------------------------------------------------------------------------
//@desc Create new employee, first save employee and then use employee id to save user
//@route POST /hr/employees
//@access Private
//first we save the studentsm then employee then user
const createNewEmployee = asyncHandler(async (req, res) => {
if (!req.body){
    return res.status(400).json({ message: "No Data received" })
}

  const {
    userFullName,
    username,
    password,
    userSex,
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
console.log(employeeCurrentEmployment,'employeeCurrentEmployment')
  //Confirm data for employee is present in the request with all required fields, data for user will be checked by the user controller
  if (!userFullName.userFirstName || !userFullName.userLastName || !username || !password || !userSex || !userDob || !userRoles.length>0 ||
     !userAddress.house|| !userAddress.street|| !userAddress.city|| !userContact.primaryPhone|| !employeeCurrentEmployment.contractType || !employeeCurrentEmployment.position
     || !employeeCurrentEmployment.joinDate || !employeeCurrentEmployment.salaryPackage.basic || !employeeYears.length>0) {
    return res.status(400).json({ message: "All fields are required" }); //400 : bad request
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
    return res.status(409).json({ message: "Duplicate username" });
  }

  // Check for duplicate userFullName
  const duplicateFullName = await User.findOne({ userFullName }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateFullName) {
    return res.status(409).json({ message: "Duplicate Full name" });
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
    employeeAssessment
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
    console.log(employeeId,'saved  employeeId');


    const userObject = {
        userFullName,
        username,
        password:hashedPwd,
        userSex,
        userDob,
        userAllowedActions,
        userIsActive,
        userRoles,
        userAddress,
        userContact,
    }; //construct new user to be stored

    const savedUser = await User.create(userObject);

    if (savedUser) {
      //if created

      //the following line res is not being executed and was causing the error [ERR_HTTP_HEADERS_SENT, now we send both res for user and parent  together in ne line
      res
        .status(201)
        .json({
          message: `New user ${username + ","} and new employee ${
            userFullName.userFirstName +
            " " +
            userFullName.userMiddleName +
            " " +
            userFullName.userLastName +
            ","
          } created`,
        }); 
    } else {
      //delete the user already craeted to be done

      res.status(400).json({ message: "Invalid employee data received" });
    }
  } else {
    res.status(400).json({ message: "Invalid user data received" });
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

module.exports = {
  getEmployeeDetails,
};

const createupdateEmployee = asyncHandler(async (req, res) => {
  const {
    userId, // ID of the user to link with this employee
    employeeJoinDate,
    employeeDocuments,
    employeeAssessment,
    employeeDepartureDate,
    employeeWorkHistory,
    employeeContractType,
    employeeSalary,
    employeePayment,
  } = req.body;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the user is already associated with an employee
  if (user.employeeId) {
    return res
      .status(400)
      .json({ message: "User is already associated with an employee" });
  }

  // Create the employee
  const newEmployee = new Employee({
    employeeJoinDate,
    employeeDocuments,
    employeeAssessment,
    employeeDepartureDate,
    employeeWorkHistory,
    employeeContractType,
    employeeSalary,
    employeePayment,
  });

  // Save the employee to the database
  const savedEmployee = await newEmployee.save();

  // Update the user to link the newly created employee
  user.employeeId = savedEmployee._id; // Add the employee reference to the user
  await user.save();

  res.status(201).json({
    message: "Employee created successfully and linked to the user",
    employee: savedEmployee,
  });
});

module.exports = {
  createupdateEmployee,
};

// @desc Update a employee, we will retrieve all information from user and parent and update and save in both collections
// @route PATCH /hr/employees
// @access Private
const updateEmployee = asyncHandler(async (req, res) => {
  const {
    id,
    userFullName,
    username,
    password,
    accessToken,
    isParent,
    isEmployee,
    userDob,
    userIsActive,
    userRoles,
    userPhoto,
    userAddress,
    userContact,
    emloyeeJoinDate,
    employeeDocuments,
    employeeAssessment,
    employeeDepartureDate,
    employeeWorkHistory,
    employeeContractType,
    employeeSalary,
    employeePayment,
  } = req.body;
  // id is the user id not employee
  // Confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(userRoles) ||
    !userRoles.length ||
    typeof userIsActive !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec(); //we did not lean because we need the save method attached to the response
  const employee = await Employee.findOne({ _id: isEmployee }).exec(); //find the parent with the id from the user

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  if (!employee) {
    return res.status(400).json({ message: "Employee not found" });
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
  user.accessToken = accessToken;
  user.isParent = isParent;
  user.isEmployee = isEmployee;
  user.userDob = userDob;
  user.userIsActive = userIsActive;
  user.userRoles = userRoles;
  user.userPhoto = userPhoto;
  user.userAddress = userAddress;
  user.userContact = userContact;
  employee.emloyeeJoinDate = emloyeeJoinDate;
  employee.employeeDocuments = employeeDocuments;
  employee.employeeAssessment = employeeAssessment;
  employee.employeeDepartureDate = employeeDepartureDate;
  employee.employeeWorkHistory = employeeWorkHistory;
  employee.employeeContractType = employeeContractType;
  employee.employeeSalary = employeeSalary;
  employee.employeePayment = employeePayment;

  if (password) {
    //only if the password is requested to be updated
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  const updatedUser = await user.save(); //save method received when we did not include lean

  // res.json({ message: `${updatedUser.username} updated` })

  if (updatedUser) {
    //if updated we will update the parent inside the if statement

    const updatedEmployee = await employee.save();

    if (updatedEmployee) {
      //if updated the parent

      res.json({
        message: ` ${updatedUser.username} updated, and employee ${
          updatedUser.userFullName.userFirstName +
          " " +
          updatedUser.userFullName.userMiddleName +
          " " +
          updatedUser.userFullName.userLastName +
          ","
        } updated`,
      }); //change parentYear later to show the parent full name
    } else {
      //delete the user already craeted to be done later

      res.status(400).json({ message: "Invalid employee data received" });
    }
  } else {
    res.status(400).json({ message: "Invalid user data received" });
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
    return res.status(400).json({ message: "User ID Required" });
  }

  // Does the parent still have assigned active students?
  // const student = await Student.findOne({ parent: id }).lean().exec()
  // if (student) {
  //     return res.status(400).json({ message: 'Parent has assigned active students' })//to be checked later
  // }

  // Does the parent exist to delete?
  const employee = await Employee.findById(id).exec();

  if (!employee) {
    return res.status(400).json({ message: "Employee not found" });
  }
  const user = await User.findOne({ isEmployee: id });

  if (!user) {
    return res.status(400).json({ message: "corresponding User not found" });
  }
  //if user is also an parent, delete only the employee collection and keep user
  if (user.isParent) {
    const result1 = await employee.deleteOne();
    const reply = `employee ${employee.id} deleted`;
    res.json(reply);
  } else {
    const result1 = await employee.deleteOne();
    const result2 = await user.deleteOne();
    console.log(result2);

    const reply = `Username ${user.username} deleted, employee ${
      user.userFullName.userFirstName +
      " " +
      user.userFullName.userMiddleName +
      " " +
      user.userFullName.userLastName
    } deleted`;

    res.json(reply);
  }
});
module.exports = {
  getAllEmployees,
  createNewEmployee,
  updateEmployee,
  deleteEmployee,
};
