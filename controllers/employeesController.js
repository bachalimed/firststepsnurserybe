const Employee = require('../models/Employee')
const User = require('../models/User')//we might need the user controller with this model

// const studentController = require ('../controllers/studentsController')
// const Student = require ('../models/Student')
const asyncHandler = require('express-async-handler')//instead of using try catch
const bcrypt = require('bcrypt') //to hash passwords before saving them
const mongoose = require('mongoose')

// @desc Get all employees
// @route GET /hr/employees              
// @access Private // later we will establish authorisations
const getAllEmployees = asyncHandler(async (req, res) => {
    // Get all employees from MongoDB
    const employees = await Employee.find().lean()

    // If no users 
    if (!employees?.length) {
        return res.status(400).json({ message: 'No employeess found' })
    }
    res.json(employees)
})


//----------------------------------------------------------------------------------
//@desc Create new employee, check how to save user and employee from the same form
//@route POST /hr/employees
//@access Private
//first we save the studentsm then employee then user
const createNewEmployee = asyncHandler(async (req, res) => {
    const { userFullName, username, password, accessToken, isParent, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact, 
        emloyeeJoinDate, employeeDocuments, employeeAssessment, employeeDepartureDate, employeeWorkHistory, employeeContractType, employeeSalary, 
        employeePayment } = req.body//this will come from front end we put all the fields ofthe collection here

    //Confirm data for employee is present in the request with all required fields, data for user will be checked by the user controller
    if ( !emloyeeJoinDate ||!employeeContractType ||!employeeSalary  ) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    // Check for duplicate employee by checking duplicate fullname, but we can have a returning employee, we will later check the dates of entry and departure to update them properly
    // const duplicateemployee = await User.findOne({ userFullName: userFullName }).lean().exec()
    // if (duplicateemployee) {
    //     return res.status(409).json({ message: `Duplicate employee name found:${duplicateemployee.userFullName.userFirstName} ` })//get the  name from  collection
    // }
    
    //Confirm user data is present in the request with all required fields
    if (!userFullName || !username ||!userDob ||!password ||!userContact || !Array.isArray(userRoles) || !userRoles.length) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await User.findOne({username }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {//we will later check if the duplicate has isEmployee and then call the update Employee method
        return res.status(409).json({ message: 'Duplicate username' })
    }

    // Check for duplicate userFullName
    const duplicateName = await User.findOne({userFullName }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicateName) {
        return res.status(409).json({ message: 'Duplicate Full name' })
    }
    
    // Hash password 
    const hashedPwd = await bcrypt.hash(password, 10) // salt roundsm we will implement it laterm normally password is without''
    
    
  //prepare new parent to be stored
    //get the user Id to store it with parent
    //const createdUserId = await User.findOne({username }).lean()/////////////////////
    ///const parentUserId= createdUserId._id/////////
    const employeeObject = { emloyeeJoinDate, employeeDocuments, employeeAssessment, employeeDepartureDate, 
        employeeWorkHistory, employeeContractType, employeeSalary, employeePayment}//construct new employee to be stored
  
//  store new employee 
const employee = await Employee.create(employeeObject)
  

    if (employee) { //if created we will create the emmployee inside the if statement
        // res.status(201).json({ message: `New user ${username} created` })


        // get id from recent document
        // Find the most recent document based on _id
    
  
           // Create and store new user 
                //const createdEmployee = await Employee.findOne({_id:id }).lean()
                const isEmployee = employee._id
                console.log(isEmployee)
                const userObject = { userFullName, username, "password" :hashedPwd, accessToken,  isParent, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact  }//construct new user to be stored

        const user = await User.create(userObject)
         
         if (user) { //if created 
             
             //the following line res is not being executed and was causing the error [ERR_HTTP_HEADERS_SENT, now we send both res for user and parent  together in ne line
             res.status(201).json({ message: `New user ${username+","} and new employee ${userFullName.userFirstName+" "+userFullName.userMiddleName+" "+userFullName.userLastName+","} created` })//change parentYear later to show the parent full name
     } else { //delete the user already craeted to be done
 
         res.status(400).json({ message: 'Invalid employee data received' })
     }

    } else { 
        res.status(400).json({ message: 'Invalid user data received' })
        
    }
       
})//we need to delete the user if the parent is not saved



// @desc Update a parent, we will retrieve all information from user and parent and update and save in both collections
// @route PATCH /students/studentsParents/parents
// @access Private
const updateEmployee = asyncHandler(async (req, res) => {
    const { id, userFullName, username, password, accessToken, isParent, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact, 
        emloyeeJoinDate, employeeDocuments, employeeAssessment, employeeDepartureDate, employeeWorkHistory, employeeContractType, employeeSalary, 
        employeePayment } = req.body
// id is the user id not employee
    // Confirm data 
    if (!id || !username || !Array.isArray(userRoles) || !userRoles.length || typeof userIsActive !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    // Does the user exist to update?
    const user = await User.findById(id).exec()//we did not lean because we need the save method attached to the response
    const employee= await Employee.findOne({_id:isEmployee}).exec() //find the parent with the id from the user

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }
    if (!employee) {
        return res.status(400).json({ message: 'Employee not found' })
    }

    // Check for duplicate 
    const duplicate = await User.findOne({ username }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    user.userFullName = userFullName//it will only allow updating properties that are already existant in the model
    user.username = username
    user.userRoles = userRoles
    user.accessToken = accessToken
    user.isParent = isParent
    user.isEmployee = isEmployee
    user.userDob = userDob
    user.userIsActive = userIsActive
    user.userRoles = userRoles
    user.userPhoto = userPhoto
    user.userAddress =userAddress
    user.userContact =userContact
    employee.emloyeeJoinDate=emloyeeJoinDate
    employee.employeeDocuments=employeeDocuments
    employee.employeeAssessment=employeeAssessment
    employee.employeeDepartureDate=employeeDepartureDate
    employee.employeeWorkHistory=employeeWorkHistory
    employee.employeeContractType=employeeContractType
    employee.employeeSalary=employeeSalary
    employee.employeePayment=employeePayment

   
        

    if (password) {//only if the password is requested to be updated
        // Hash password 
        user.password = await bcrypt.hash(password, 10) // salt rounds 
    }

    const updatedUser = await user.save()//save method received when we did not include lean
    

    // res.json({ message: `${updatedUser.username} updated` })



    if (updatedUser) { //if updated we will update the parent inside the if statement
        
        const updatedEmployee = await employee.save()
         
        
         if (updatedEmployee) { //if updated the parent 
               
             res.json({ message: ` ${updatedUser.username} updated, and employee ${updatedUser.userFullName.userFirstName+" "+updatedUser.userFullName.userMiddleName+" "+updatedUser.userFullName.userLastName+","} updated` })//change parentYear later to show the parent full name
     } else { //delete the user already craeted to be done later
 
         res.status(400).json({ message: 'Invalid employee data received' })
     }

    } else { 
        res.status(400).json({ message: 'Invalid user data received' })       
    }

})


//--------------------------------------------------------------------------------------1   
// @desc Delete a parent, if no isEmployee, then delete the user orelse delete only parent and keep its user, if students are active dont delete
// @route DELETE /students/studentsParents/parents
// @access Private
const deleteEmployee = asyncHandler(async (req, res) => {//uses parent id
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the parent still have assigned active students?
    // const student = await Student.findOne({ parent: id }).lean().exec()
    // if (student) {
    //     return res.status(400).json({ message: 'Parent has assigned active students' })//to be checked later
    // }


    // Does the parent exist to delete?
    const employee = await Employee.findById(id).exec()

    if (!employee) {
        return res.status(400).json({ message: 'Employee not found' })
    }
    const user = await User.findOne({isEmployee:id})
    
    if (!user) {
        return res.status(400).json({ message: 'corresponding User not found' })
    }
    //if user is also an parent, delete only the employee collection and keep user
    if(user.isParent){
        const result1 = await employee.deleteOne()
        const reply = `employee ${employee.id} deleted`
       res.json(reply)
    } else{

         const result1 = await employee.deleteOne()
        	const result2 = await user.deleteOne()
			console.log(result2)

        	const reply = `Username ${user.username} deleted, employee ${user.userFullName.userFirstName + " " + user.userFullName.userMiddleName+ " "+ user.userFullName.userLastName} deleted`

			  res.json(reply)
		}
        
})
module.exports = {
    getAllEmployees,
    createNewEmployee,
    updateEmployee,
    deleteEmployee
}