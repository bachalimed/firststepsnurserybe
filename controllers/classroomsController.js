// const User = require('../models/User')
const Classroom = require('../models/Classroom')
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')

// @desc Get all classroom
// @route GET 'desk/classroom             
// @access Private // later we will establish authorisations
const getAllClassrooms = asyncHandler(async (req, res) => {
   // console.log('helloooooooo')
    
        // Check if an ID is passed as a query parameter
        if (req.query.id) {
            const { id } = req.query;

            // Find a single attended school by its ID
            const classroom = await Classroom.findOne({ _id: id }).lean();

            if (!classroom) {
                return res.status(404).json({ message: 'Attended School not found' });
            }

            return res.json(classroom);
        } 
        
        // If no ID is provided, fetch all attended schools
        const classrooms = await Classroom.find().lean();

        if (!classrooms.length) {
            return res.status(404).json({ message: 'No attended schools found' });
        }

        res.json(classrooms);
    
       
   
});





// // @desc getClassroomByUSerId
// // @route GET 'desk/classroom/myClassroom with userID passed in the body of the query             
// // @access Private // later we will establish authorisations
// const getClassroomByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const classroom = await Classroom.find().lean()//this will not return the extra data(lean)

//     // If no students 
//     if (!classroom?.length) {
//         return res.status(400).json({ message: 'No classrooms found from classroom controller with love' })
//     }
//     res.json(classroom)
// })








//----------------------------------------------------------------------------------
// @desc Create new classroom
// @route POST 'desk/classroom
// @access Private
const createNewClassroom = asyncHandler(async (req, res) => {
    const { classroomNumber, classroomLabel, classroomCapacity, classroomMaxCapacity, classroomColor } = req?.body//this will come from front end we put all the fields o fthe collection here

    //Confirm data is present in the request with all required fields
        
        if ( !classroomNumber || !classroomLabel || !classroomCapacity || !classroomMaxCapacity) {
        return res.status(400).json({ message: 'Required fields are missing' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await Classroom.findOne({classroomNumber }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {
        return res.status(409).json({ message: `Duplicate classroom: ${duplicate.classroomNumber}, found` })
    }
  
    
    const classroomObject = { classroomNumber, classroomLabel, classroomCapacity, classroomMaxCapacity, classroomColor}//construct new classroom to be stored

    // Create and store new classroom 
    const classroom = await Classroom.create(classroomObject)

    if (classroom) { //if created 
        res.status(201).json({ message: `New classroom of subject: ${classroom.classroomLabel}, created` })
    } else {
        res.status(400).json({ message: 'Invalid classroom data received' })
    }
})




// @desc Update a classroom
// @route PATCH 'desk/classroom
// @access Private
const updateClassroom = asyncHandler(async (req, res) => {
    const { id, classroomNumber, classroomLabel, classroomCapacity, classroomMaxCapacity, classroomColor   } = req?.body

    // Confirm data 
    if (!id ||!classroomNumber ||! classroomLabel ||! classroomCapacity ||! classroomMaxCapacity) {
        return res.status(400).json({ message: 'All mandatory fields required' })
    }

    // Does the classroom exist to update?
    const classroom = await Classroom.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!classroom) {
        return res.status(400).json({ message: 'Classroom not found' })
    }


    classroom.classroomNumber = classroomNumber//it will only allow updating properties that are already existant in the model
    classroom.classroomLabel = classroomLabel
    classroom.classroomCapacity = classroomCapacity    
    classroom.classroomMaxCapacity = classroomMaxCapacity    
    classroom.classroomColor = classroomColor    
    
    const updatedClassroom = await classroom.save()//save method received when we did not include lean

    res.json({ message: `classroom: ${updatedClassroom.classroomLabel}, updated!` })
})



//--------------------------------------------------------------------------------------1   
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteClassroom = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Classroom ID Required' })
    }

    // Does the user exist to delete?
    const classroom = await Classroom.findById(id).exec()

    if (!classroom) {
        return res.status(400).json({ message: 'Classroom not found' })
    }

    const result = await classroom.deleteOne()

    const reply = `classroom ${classroom.classroomLabel}, with ID ${classroom._id}, deleted`

    res.json({message:reply})
})



module.exports = {
    getAllClassrooms,
    createNewClassroom,
    updateClassroom,
    deleteClassroom
 
}