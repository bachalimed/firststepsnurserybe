const express = require('express')
const router = express.Router()
const classroomsController = require('../controllers/classroomsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/classrooms' t because in server.js the route is already 
    .get(classroomsController.getAllClassrooms)
    .post(classroomsController.createNewClassroom)
    .patch(classroomsController.updateClassroom)
    .delete(classroomsController.deleteClassroom)

module.exports = router