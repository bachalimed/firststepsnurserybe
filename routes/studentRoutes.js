const express = require('express')
const router = express.Router()
const studentsController = require('../controllers/studentsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'students/studentsParents/students' because in server.js the route is already admin/users
    .get(studentsController.getAllStudents)
    .post(studentsController.createNewStudent)
    .patch(studentsController.updateStudent)
    .delete(studentsController.deleteStudent)

module.exports = router