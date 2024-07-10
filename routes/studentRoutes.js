const express = require('express')
const router = express.Router()
const studentsController = require('../controllers/studentsController')

router.route('/')//this '/' is now  'students/studentsParents/students' because in server.js the route is already admin/users
    .get(studentsController.getAllStudents)
    .post(studentsController.createNewStudent)
    .patch(studentsController.updateStudent)
    .delete(studentsController.deleteStudent)

module.exports = router