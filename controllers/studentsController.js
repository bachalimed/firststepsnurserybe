// const User = require('../models/User')
const Student = require('../models/Student')//we might need the parent module in this controller
//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require('express-async-handler')//instead of using try catch
const useSelectedAcademicYear = require ('../middleware/setCurrentAcademicYear')
const mongoose = require('mongoose')



// @desc Get all students
// @route GET 'students/studentsParents/students             
// @access Private // later we will establish authorisations
const getAllStudents = asyncHandler(async (req, res) => {
    // Get all students from MongoDB
    
    if(req.query.selectedYear){
    const {selectedYear} = req.query//maybe replace the conditionals with the current year that we get  from middleware
    //console.log(selectedYear, "sleected year inback")
    const students = await Student.find({ studentYear: selectedYear }).lean()//this will not return the extra data(lean)
    //const students = await Student.find({ studentYear: '2023/2024' }).lean()//this will not return the extra data(lean)
    console.log('with year select')
    if (!students?.length===0) {
        return res.status(400).json({ message: 'No studentss found' })
    }
    console.log('returned res', students)
    res.json(students)
    }else if(req.query.id){
        const {id} = req.query
        const student = await Student.find({ _id: id }).lean()//this will not return the extra data(lean)
    
    console.log('with id  select')
    if (!student?.length===0) {
        return res.status(400).json({ message: 'No studentss found' })
    }
    console.log('returned res', student)
    res.json(student)

    }else {
    const students = await Student.find().lean()//this will not return the extra data(lean)
    console.log('with no select')
    if (!students?.length===0) {
        return res.status(400).json({ message: 'No studentss found' })
    }
    console.log('returned res', students)
    res.json(students)}

    // If no students 
   
    //res.json(students)
})


//----------------------------------------------------------------------------------
// @desc Create new user
// @route POST 'students/studentsParents/students
// @access Private
const createNewStudent = asyncHandler(async (req, res) => {
    const { studentName, studentDob,  studentSex, studentIsActive, studentYear, studentPhoto, studentParent,
         studentContact, studentJointFamily, studentGardien, studentEducation, lastModified, studentDocuments, 
         admissions   } = req.body//this will come from front end we put all the fields o fthe collection here

    //Confirm data is present in the request with all required fields
    if (!studentName || !studentDob ||!studentSex ||!studentYear ||!Array.isArray(studentEducation) || !studentEducation.length) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    
    // Check for duplicate username
    const duplicate = await Student.findOne({studentName }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate student name' })
    }

    // Check for duplicate userFullName
    const duplicateFamily = await Student.findOne({studentParent }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicateFamily) {
        return res.status(409).json({ message: 'Duplicate parents found' })
    }
    
    
    const studentObject = { studentName, studentDob,  studentSex, studentIsActive, studentYear, studentPhoto, studentParent,
        studentContact, studentJointFamily, studentGardien, studentEducation, lastModified, studentDocuments, 
        admissions }//construct new student to be stored

    // Create and store new student 
    const student = await Student.create(studentObject)

    if (student) { //if created 
        res.status(201).json({ message: `New student ${studentName.firstName} created` })
    } else {
        res.status(400).json({ message: 'Invalid student data received' })
    }
})
//internalcontroller :CreateNew User to be used by other controllers??







// @desc Update a student
// @route PATCH 'students/studentsParents/students
// @access Private
const updateStudent = asyncHandler(async (req, res) => {
    const { id, studentName, studentDob,  studentSex, studentIsActive, studentYear, studentPhoto, studentParent,
        studentContact, studentJointFamily, studentGardien, studentEducation, lastModified, studentDocuments, 
        admissions  } = req.body

    // Confirm data 
    if (!studentName || !studentDob ||!studentSex ||!studentYear ||!Array.isArray(studentEducation) || !studentEducation.length) {
        return res.status(400).json({ message: 'All fields except required' })
    }

    // Does the student exist to update?
    const student = await Student.findById(id).exec()//we did not lean becausse we need the save method attached to the response

    if (!student) {
        return res.status(400).json({ message: 'Student not found' })
    }

    // Check for duplicate 
    const duplicate = await Student.findOne({ studentName }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate name' })
    }

    student.studentName = studentName//it will only allow updating properties that are already existant in the model
    student.studentDob = studentDob
    student.studentSex = studentSex
    student.studentIsActive = studentIsActive
    student.studentYear = studentYear
    student.studentPhoto = studentPhoto
    student.studentParent = studentParent
    student.studentContact = studentContact
    student.studentJointFamily = studentJointFamily
    student.studentGardien = studentGardien
    student.studentEducation = studentEducation
    student.lastModified = lastModified
    student.studentDocuments = studentDocuments
    student.admissions = admissions
   
    const updatedStudent = await student.save()//save method received when we did not include lean

    res.json({ message: `student ${updatedStudent.studentName.firstName+" "+updatedStudent.studentName.middleName+" "+updatedStudent.studentName.lastName}, updated` })
})
//--------------------------------------------------------------------------------------1   
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteStudent = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Student ID Required' })
    }

    // Does the user still have assigned notes?
    // const note = await Note.findOne({ user: id }).lean().exec()
    // if (note) {
    //     return res.status(400).json({ message: 'User has assigned notes' })
    // }


    // Does the user exist to delete?
    const student = await Student.findById(id).exec()

    if (!student) {
        return res.status(400).json({ message: 'Student not found' })
    }

    const result = await student.deleteOne()

    const reply = `student ${student.studentName.firstName+" "+student.studentName.middleName+" "+student.studentName.lastName}, with ID ${result._id} deleted`

    res.json(reply)
})



module.exports = {
    getAllStudents,
    createNewStudent,
    updateStudent,
    deleteStudent,
    
    
}