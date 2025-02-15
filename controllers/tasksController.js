// const User = require('../models/User')
const Task = require('../models/Task')
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
        return res.status(400).json({ message: 'No taskss found from task controller with love' })
    }
    res.json(tasks)
})
// // @desc getTasksByUSerId
// // @route GET 'desk/tasks/myTasks with userID passed in the body of the query             
// // @access Private // later we will establish authorisations
// const getTasksByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const tasks = await Task.find().lean()//this will not return the extra data(lean)

//     // If no students 
//     if (!tasks?.length) {
//         return res.status(400).json({ message: 'No taskss found from task controller with love' })
//     }
//     res.json(tasks)
// })








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
        return res.status(400).json({ message: 'Required data is missing' })//400 : bad request
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
        res.status(201).json({ message: `Task created successfully` })
    } else {
        res.status(400).json({ message: 'Invalid data received' })
    }
})




// @desc Update a task
// @route PATCH 'desk/tasks
// @access Private
const updateTask = asyncHandler(async (req, res) => {
    const { id, taskCreationDate, taskPriority, taskSubject, taskDescription, taskCreator, taskReference,  taskDueDate,
        taskResponsible, taskAction, taskState, taskCompletionDate, lastModified, taskYear  } = req.body

    // Confirm data 
    if (!taskCreationDate ||!taskPriority ||! taskSubject ||! taskDescription ||! taskCreator 
        ||! taskDueDate||! taskResponsible||! taskState||! lastModified.operator||! taskYear) {
        return res.status(400).json({ message: 'Required data is missing' })
    }

    // Does the task exist to update?
    const task = await Task.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!task) {
        return res.status(400).json({ message: 'Task not found' })
    }

    // Check for duplicate 
    const duplicate = await Task.findOne({ taskSubject }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate task' })
    }

    task.taskCreationDate = taskCreationDate//it will only allow updating properties that are already existant in the model
    task.taskPriority = taskPriority
    task.taskSubject = taskSubject
    task.taskDescription = taskDescription
    task.taskCreator = taskCreator
    task.taskReference = taskReference
    task.taskDueDate = taskDueDate
    task.taskResponsible = taskResponsible
    task.taskAction = taskAction
    task.taskState = taskState
    task.taskCompletionDate = taskCompletionDate
    task.lastModified = lastModified
    task.taskYear = taskYear
    
    
    const updatedTask = await task.save()//save method received when we did not include lean

    res.json({ message: `Task updated successfully` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteTask = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Required data is missing' })
    }

    // Does the user exist to delete?
    const task = await Task.findById(id).exec()

    if (!task) {
        return res.status(400).json({ message: 'Task not found' })
    }

    const result = await task.deleteOne()

    const reply = `Deleted ${result?.deletedCount} task`

    return res.json(reply)
})



module.exports = {
    getAllTasks,
    createNewTask,
    updateTask,
    deleteTask
 
}