const express = require('express')
const router = express.Router()
const upload = require('./../config/multerConfig')


const studentDocumentsController = require('../controllers/studentDocumentsController')
const StudentDocument = require('../models/StudentDocument')




const verifyJWT= require('../middleware/verifyJWT')
//console.log('here nowwwwwww')

router.use(verifyJWT)
router.route('/:id')//this '/' is not root path but the complementary to previous route
.get(studentDocumentsController.getFileById)
.delete(studentDocumentsController.deleteStudentDocument)
module.exports = router

router.route('/')//this '/' is not root path but the complementary to previous route
.get(studentDocumentsController.getAllStudentDocuments)
.post(upload.single('file'), studentDocumentsController.createNewStudentDocument)
.patch(studentDocumentsController.updateStudentDocument)


module.exports = router

