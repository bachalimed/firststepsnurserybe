const express = require('express')
const router = express.Router()
const upload = require('./../config/multerConfig')

const studentDocumentsController = require('../controllers/studentDocumentsController')
const StudentDocument = require('../models/StudentDocument')




const verifyJWT= require('../middleware/verifyJWT')
console.log('here nowwwwwww')

router.use(verifyJWT)

router.route('/')//this '/' is not root path but the complementary to previous route
    .get(studentDocumentsController.getAllStudentDocuments)
    //.post('/upload',upload.array('documents'), studentDocumentsController.createNewStudentDocument)
    .patch(studentDocumentsController.updateStudentDocument)
    .delete(studentDocumentsController.deleteStudentDocument)

module.exports = router