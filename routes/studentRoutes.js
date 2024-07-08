const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')

router.route('/')//this '/' is now  '/admin/users' t because in server.js the route is already admin/users
    .get(studentsController.getAllStudents)
    .post(studentsController.createNewStudent)
    .patch(studentsController.updateStudent)
    .delete(studentsController.deleteStudent)

module.exports = router