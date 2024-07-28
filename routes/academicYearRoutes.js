const express = require('express')
const router = express.Router()
const academicYearsController = require('../controllers/academicYearsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/academicYears' t because in server.js the route is already 
    .get(academicYearsController.getAllAcademicYears)
    .post(academicYearsController.createNewAcademicYear)
    .patch(academicYearsController.updateAcademicYear)
    .delete(academicYearsController.deleteAcademicYear)

module.exports = router
