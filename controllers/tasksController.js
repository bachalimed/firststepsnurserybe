// const User = require('../models/User')
const Task = require('../models/Task')
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')

// @desc Get all tasks
// @route GET 'desk/tasks             
// @access Private // later we will establish authorisations
const getAllTasks = asyncHandler(async (req, res) => {
    // Get all students from MongoDB
    const tasks = await Task.find().lean()//this will not return the extra data(lean)

    // If no students 
    if (!tasks?.length) {
        return res.status(400).json({ message: 'No taskss found' })
    }
    res.json(tasks)
})


//----------------------------------------------------------------------------------
// @desc Create new task
// @route POST 'desk/tasks
// @access Private
const createNewTask = asyncHandler(async (req, res) => {
    const { taskCreationDate, taskPriority, taskSubject, taskDescription, taskCreator, taskReference,  taskDueDate,
        taskResponsible, taskAction, taskState, taskCompletionDate, lastModified, taskOperator, taskYear
      } = req.body//this will come from front end we put all the fields o fthe collection here

    //Confirm data is present in the request with all required fields
        
        if (!taskCreationDate ||!taskPriority ||! taskSubject ||! taskDescription ||! taskCreator 
            ||! taskDueDate||! taskResponsible||! taskState||! lastModified.operator||! taskYear) {
        return res.status(400).json({ message: 'All mandatory fields are required' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await Task.findOne({taskSubject }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate&&duplicate.taskReference== taskReference) {
        return res.status(409).json({ message: `Duplicate task: ${duplicate.taskSubject}, found` })
    }
  
    
    const taskObject = { taskCreationDate, taskPriority, taskSubject, taskDescription, taskCreator, taskReference,  taskDueDate,
        taskResponsible, taskAction, taskState, taskCompletionDate, lastModified, taskOperator, taskYear}//construct new tasks to be stored

    // Create and store new task 
    const task = await Task.create(taskObject)

    if (task) { //if created 
        res.status(201).json({ message: `New task of subject: ${task.taskSubject}, created` })
    } else {
        res.status(400).json({ message: 'Invalid task data received' })
    }
})
//internalcontroller :CreateNew User to be used by other controllers??







// // @desc Update a student
// // @route PATCH 'students/studentsParents/students
// // @access Private
// const updateStudent = asyncHandler(async (req, res) => {
//     const { id, studentName, studentDob,  studentSex, studentIsActive, studentYear, studentPhoto, studentParent,
//         studentContact, studentJointFamily, studentGardien, studentEducation, lastModified, studentDocuments, 
//         admissions  } = req.body

//     // Confirm data 
//     if (!studentName || !studentDob ||!studentSex ||!studentYear ||!Array.isArray(studentEducation) || !studentEducation.length) {
//         return res.status(400).json({ message: 'All fields except required' })
//     }

//     // Does the student exist to update?
//     const student = await Student.findById(id).exec()//we did not lean becausse we need the save method attached to the response

//     if (!student) {
//         return res.status(400).json({ message: 'Student not found' })
//     }

//     // Check for duplicate 
//     const duplicate = await Student.findOne({ studentName }).lean().exec()

//     // Allow updates to the original user 
//     if (duplicate && duplicate?._id.toString() !== id) {
//         return res.status(409).json({ message: 'Duplicate name' })
//     }

//     student.studentName = studentName//it will only allow updating properties that are already existant in the model
//     student.studentDob = studentDob
//     student.studentSex = studentSex
//     student.studentIsActive = studentIsActive
//     student.studentYear = studentYear
//     student.studentPhoto = studentPhoto
//     student.studentParent = studentParent
//     student.studentContact = studentContact
//     student.studentJointFamily = studentJointFamily
//     student.studentGardien = studentGardien
//     student.studentEducation = studentEducation
//     student.lastModified = lastModified
//     student.studentDocuments = studentDocuments
//     student.admissions = admissions
   
//     const updatedStudent = await student.save()//save method received when we did not include lean

//     res.json({ message: `student ${updatedStudent.studentName.firstName+" "+updatedStudent.studentName.middleName+" "+updatedStudent.studentName.lastName}, updated` })
// })
// //--------------------------------------------------------------------------------------1   
// // @desc Delete a student
// // @route DELETE 'students/studentsParents/students
// // @access Private
// const deleteStudent = asyncHandler(async (req, res) => {
//     const { id } = req.body

//     // Confirm data
//     if (!id) {
//         return res.status(400).json({ message: 'Student ID Required' })
//     }

//     // Does the user still have assigned notes?
//     // const note = await Note.findOne({ user: id }).lean().exec()
//     // if (note) {
//     //     return res.status(400).json({ message: 'User has assigned notes' })
//     // }


//     // Does the user exist to delete?
//     const student = await Student.findById(id).exec()

//     if (!student) {
//         return res.status(400).json({ message: 'Student not found' })
//     }

//     const result = await student.deleteOne()

//     const reply = `student ${student.studentName.firstName+" "+student.studentName.middleName+" "+student.studentName.lastName}, with ID ${result._id} deleted`

//     res.json(reply)
// })



module.exports = {
    getAllTasks,
    createNewTask,
//     updateTask,
//     deleteTask
    
}