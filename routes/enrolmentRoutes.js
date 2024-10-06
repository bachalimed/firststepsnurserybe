const express = require('express')
const router = express.Router()
const enrolmentsController = require('../controllers/enrolmentsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/enrolments' t because in server.js the route is already 
    .get(enrolmentsController.getAllEnrolments)
    .post(enrolmentsController.createNewEnrolment)
    .patch(enrolmentsController.updateEnrolment)
    .delete(enrolmentsController.deleteEnrolment)

module.exports = router