// const User = require('../models/User')
const Family = require('../models/Family')//we might need the parent module in this controller
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch
const useSelectedAcademicYear = require ('../middleware/setCurrentAcademicYear')
const mongoose = require('mongoose')



// @desc Get all families
// @route GET 'families/familiesParents/families             
// @access Private // later we will establish authorisations
const getAllFamilies = asyncHandler(async (req, res) => {
    // Get all families from MongoDB
    console.log('request', req.query)
    if(req.query.selectedYear){
    const {selectedYear} = req.query//maybe replace the conditionals with the current year that we get  from middleware
    console.log(selectedYear, "sleected year inback")
    //will retrive all teh families
    if (selectedYear === '1000'){
        const families = await Family.find().populate('father').populate('mother').populate({path:'children'}).lean()
        console.log(families, 'families')
        if (!families?.length) {
            return res.status(400).json({ message: 'No families found!' })
        }else{
        //console.log('returned res', families)
        res.json(families)}
    }
    //will retrieve only the selcted year
            const families = await Family.find({ familyYears:{$elemMatch:{academicYear: selectedYear }}}).lean()//this will not return the extra data(lean)
            //const families = await Family.find({ familyYear: '2023/2024' }).lean()//this will not return the extra data(lean)
            //console.log('with year select',selectedYear,  families)
            if (!families?.length) {
                return res.status(400).json({ message: 'No families found  for the selected academic year' })
            }else{
            //console.log('returned res', families)
            res.json(families)}
    //will retreive according to the id
    }else if(req.query.id){
        const {id} = req.query
        const family = await Family.find({ _id: id }).lean()//this will not return the extra data(lean)//removed populate father and mother
    
    //console.log('with id  select')
    if (!family?.length) {
        return res.status(400).json({ message: 'No family found for the Id provided' })
    }
    //console.log('returned res', family)
    res.json(family)

    }else {
    const families = await Family.find().lean()//this will not return the extra data(lean)
    //console.log('with no select')
    if (!families?.length) {
        return res.status(400).json({ message: 'No families found' })
    }
    //console.log('returned res', families)
    res.json(families)}

    // If no families 
   
    //res.json(families)
})


//----------------------------------------------------------------------------------
// @desc Create new user
// @route POST 'families/familiesParents/families
// @access Private
const createNewFamily = asyncHandler(async (req, res) => {
    const { familyName, familyDob,  familiesex, familyIsActive, familyYears, familyGardien, familyEducation, lastModified } = req.body//this will come from front end we put all the fields o fthe collection here
//console.log(familyName, familyDob,  familiesex, familyIsActive, familyYears, familyGardien, familyEducation, lastModified)
    //Confirm data is present in the request with all required fields
    if (!familyName || !familyDob ||!familiesex ||!familyYears ) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }

    
    // Check for duplicate username
    const duplicate = await Family.findOne({familyDob}).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate?.familyName.lastName===familyName.lastName &&duplicate?.familiesex===familiesex) {
        return res.status(409).json({ message: ` possible duplicate family name ${duplicate.familyName.firstName} ${duplicate.familyName.middleName} ${duplicate.familyName.lastName}` })
    }
   
   



     
    const familyObject = { familyName, familyDob,  familiesex, familyIsActive, familyYears, familyGardien, familyEducation, lastModified}//construct new family to be stored

    // Create and store new family 
    const family = await Family.create(familyObject)

    if (family) { //if created 
        res.status(201).json({ message: `New family ${familyName.firstName} ${familyName.middleName} ${familyName.lastName} created` })
    } else {
        res.status(400).json({ message: 'Invalid family data received' })
    }
})
//internalcontroller :CreateNew User to be used by other controllers??


// @desc Update a family
// @route PATCH 'families/familiesParents/families
// @access Private
const updateFamily = asyncHandler(async (req, res) => {
    const { id, familyName, familyDob,  familiesex, familyIsActive, familyYears, familyContact, familyGardien, familyEducation, operator,  
        admissions  } = req.body
console.log(req.body)
    // Confirm data 
    if (!familyName || !familyDob ||!familiesex ||!familyYears ||!Array.isArray(familyEducation) || !familyEducation.length) {
        return res.status(400).json({ message: 'All fields except required' })
    }

    // Does the family exist to update?
    const family = await Family.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!family) {
        return res.status(400).json({ message: 'Family not found' })
    }

    // Check for duplicate 
    const duplicate = await Family.findOne({ familyName }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate name' })
    }

    family.familyName = familyName//it will only allow updating properties that are already existant in the model
    family.familyDob = familyDob
    family.familiesex = familiesex
    family.familyIsActive = familyIsActive
    family.familyYears = familyYears
    family.familyContact = familyContact
    family.familyGardien = familyGardien
    family.familyEducation = familyEducation
    family.operator = operator
    family.admissions = admissions
   
    const updatedFamily = await family.save()//save method received when we did not include lean

    res.json({ message: `family ${updatedFamily.familyName.firstName+" "+updatedFamily.familyName.middleName+" "+updatedFamily.familyName.lastName}, updated` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a family
// @route DELETE 'families/familiesParents/families
// @access Private
const deleteFamily = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Family ID Required' })
    }

    // Does the user still have assigned notes?
    // const note = await Note.findOne({ user: id }).lean().exec()
    // if (note) {
    //     return res.status(400).json({ message: 'User has assigned notes' })
    // }


    // Does the user exist to delete?
    const family = await Family.findById(id).exec()

    if (!family) {
        return res.status(400).json({ message: 'Family not found' })
    }

    const result = await family.deleteOne()

    const reply = `family ${family.familyName.firstName+" "+family.familyName.middleName+" "+family.familyName.lastName}, with ID ${result._id} deleted`

    res.json(reply)
})



module.exports = {
    getAllFamilies,
    createNewFamily,
    updateFamily,
    deleteFamily,
    
    
}