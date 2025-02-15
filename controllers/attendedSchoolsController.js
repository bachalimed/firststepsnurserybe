// const User = require('../models/User')
const AttendedSchool = require('../models/AttendedSchool')
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')

// @desc Get all attendedSchool
// @route GET 'desk/attendedSchool             
// @access Private // later we will establish authorisations
const getAllAttendedSchools = asyncHandler(async (req, res) => {
    try {
        // Check if an ID is passed as a query parameter
        if (req.query.id) {
            const { id } = req.query;

            // Find a single attended school by its ID
            const attendedSchool = await AttendedSchool.findOne({ _id: id }).lean();

            if (!attendedSchool) {
                return res.status(404).json({ message: 'Attended School not found' });
            }

            return res.json(attendedSchool);
        } 
        
        // If no ID is provided, fetch all attended schools
        const attendedSchools = await AttendedSchool.find().lean();

        if (!attendedSchools.length) {
            return res.status(404).json({ message: 'No attended schools found' });
        }

        res.json(attendedSchools);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching attended schools', error: error.message });
    }
});





// // @desc getAttendedSchoolByUSerId
// // @route GET 'desk/attendedSchool/myAttendedSchool with userID passed in the body of the query             
// // @access Private // later we will establish authorisations
// const getAttendedSchoolByUSerId = asyncHandler(async (req, res) => {
//     // Get all  from MongoDB
//     const{userId}=req.bodyconsole.log(userId)
//     const attendedSchool = await AttendedSchool.find().lean()//this will not return the extra data(lean)

//     // If no students 
//     if (!attendedSchool?.length) {
//         return res.status(400).json({ message: 'No attendedSchools found from attendedSchool controller with love' })
//     }
//     res.json(attendedSchool)
// })








//----------------------------------------------------------------------------------
// @desc Create new attendedSchool
// @route POST 'desk/attendedSchool
// @access Private
const createNewAttendedSchool = asyncHandler(async (req, res) => {
    const { schoolName, schoolCity, schoolType, schoolColor } = req?.body//this will come from front end we put all the fields o fthe collection here
console.log(schoolName, schoolCity, schoolType, schoolColor)
    //Confirm data is present in the request with all required fields
        
        if ( !schoolName || !schoolCity || !schoolType ||!schoolColor) {
        return res.status(400).json({ message: 'Required data is missing' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await AttendedSchool.findOne({schoolName }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate&&duplicate.schoolType== schoolType) {
        return res.status(409).json({ message: `Duplicate school: ${duplicate.schoolName}, found` })
    }
  
    
    const attendedSchoolObject = { schoolName, schoolCity, schoolType ,schoolColor}//construct new attendedSchool to be stored

    // Create and store new attendedSchool 
    const attendedSchool = await AttendedSchool.create(attendedSchoolObject)

    if (attendedSchool) { //if created 
        res.status(201).json({ message: `School ${attendedSchool.schoolName}, created Successfully` })
    } else {
        res.status(400).json({ message: 'Invalid data received' })
    }
})




// @desc Update a attendedSchool
// @route PATCH 'desk/attendedSchool
// @access Private
const updateAttendedSchool = asyncHandler(async (req, res) => {
    const { id, schoolName, schoolCity, schoolType, schoolColor  } = req?.body

    // Confirm data 
    if (!id ||!schoolName ||! schoolCity ||! schoolType || !schoolColor) {
        return res.status(400).json({ message: 'Required data is missing' })
    }

    // Does the attendedSchool exist to update?
    const attendedSchool = await AttendedSchool.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!attendedSchool) {
        return res.status(400).json({ message: 'AttendedSchool not found' })
    }


    attendedSchool.schoolName = schoolName//it will only allow updating properties that are already existant in the model
    attendedSchool.schoolCity = schoolCity
    attendedSchool.schoolType = schoolType    
    attendedSchool.schoolColor = schoolColor    
    
    const updatedAttendedSchool = await attendedSchool.save()//save method received when we did not include lean

    res.json({ message: `School updated successfully` })
})



//--------------------------------------------------------------------------------------1   
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteAttendedSchool = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Required data is missing' })
    }

    // Does the user exist to delete?
    const attendedSchool = await AttendedSchool.findById(id).exec()

    if (!attendedSchool) {
        return res.status(400).json({ message: 'AttendedSchool not found' })
    }

    const result = await attendedSchool.deleteOne()

    const reply = `Deleted ${result?.deletedCount} school`

   return  res.json({message:reply})
})



module.exports = {
    getAllAttendedSchools,
    createNewAttendedSchool,
    updateAttendedSchool,
    deleteAttendedSchool
 
}