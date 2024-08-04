const AcademicYear = require('../models/AcademicYear')

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch

const mongoose = require('mongoose')
const { setCurrentAcademicYear } = require('../middleware/setCurrentAcademicYear')
// @desc Get all academicYears
// @route GET /admin/academicYears              ??how to modify this route to admin/academicYears is in serve.js and academicYearRoutes
// @access Private // later we will establish authorisations
const getAllAcademicYears = asyncHandler(async (req, res) => {
    // Get all academicYears from MongoDB
    const academicYearsold = await AcademicYear.find().lean()//this will not return  other extra data(lean)

    // If no academicYears 
    if (!academicYearsold?.length) {
        return res.status(400).json({ message: 'No academicYearss found' })
    }

    //here we  specify which is the current year by comparing, will not save the current in the DB
    else{
        const academicYears = await setCurrentAcademicYear(academicYearsold)// this will the return the updated list already
        
        //const academicYears = await AcademicYear.find().lean()



        res.status(200).json(academicYears)
    //   } catch (error) {
    //     res.status(500).send('Error setting the current academic year.')
      }
     
})

//----------------------------------------------------------------------------------
// @desc Create new academicYear
// @route POST /admin/academicYears
// @access Private
const createNewAcademicYear = asyncHandler(async (req, res) => {
    const { title, yearStart, yearEnd, currentYear, academicYearCreator} = req.body//this will come from front end we put all the fields o fthe collection here

    //Confirm data is present in the request with all required fields
    if (!title || !yearStart ||!yearEnd ||!currentYear ||!academicYearCreator ) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    
    // Check for duplicate academicYearname
    const duplicate = await AcademicYear.findOne({yearStart }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate academicYear' })
    }
    

    const academicYearObject = { title, yearStart, yearEnd, currentYear, academicYearCreator  }//construct new academicYear to be stored

    // Create and store new academicYear 
    const academicYear = await AcademicYear.create(academicYearObject)

    if (academicYear) { //if created 
        res.status(201).json({ message: `New academic Year ${academicYear.title} created` })
    } else {
        res.status(400).json({ message: 'Invalid academic Year data received' })
    }
})





// @desc Update a academicYear
// @route PATCH /admin/academicYears
// @access Private
const updateAcademicYear = asyncHandler(async (req, res) => {
    const { id, title, yearStart, yearEnd, currentYear, academicYearCreator  } = req.body

    // Confirm data 
    if (!id || !title || !yearStart|| !yearEnd || !currentYear || !academicYearCreator) {
        return res.status(400).json({ message: 'All fields  are required' })
    }

    // Does the academicYear exist to update?
    const academicYear = await AcademicYear.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!academicYear) {
        return res.status(400).json({ message: 'Academic Year not found' })
    }

    // Check for duplicate 
    const duplicate = await AcademicYear.findOne({ title }).lean().exec()

    // Allow updates to the original academicYear 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate academic Year' })
    }

    academicYear.title = title//it will only allow updating properties that are already existant in the model
    academicYear.yearStart = yearStart
    academicYear.yearEnd = yearEnd
    academicYear.currentYear = currentYear
    academicYear.academicYearCreator = academicYearCreator
   

    const updatedAcademicYear = await academicYear.save()//save method received when we did not include lean

    res.json({ message: `${updatedAcademicYear.academicYearname} updated` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a academicYear
// @route DELETE /admin/academicYears
// @access Private
const deleteAcademicYear = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Academic Year ID Required' })
    }

    // Does the academicYear still have assigned notes?
    // const note = await Note.findOne({ academicYear: id }).lean().exec()
    // if (note) {
    //     return res.status(400).json({ message: 'AcademicYear has assigned notes' })
    // }


    // Does the academicYear exist to delete?
    const academicYear = await AcademicYear.findById(id).exec()

    if (!academicYear) {
        return res.status(400).json({ message: 'Academic Year not found' })
    }

    const result = await academicYear.deleteOne()

    const reply = `AcademicYearname ${result.academicYearname} with ID ${result._id} deleted`

    res.json(reply)
})



module.exports = {
    getAllAcademicYears,
    createNewAcademicYear,
    updateAcademicYear,
    deleteAcademicYear
    
}