const express = require('express')
const router = express.Router()
const upload = require('./../config/multerConfig')


const employeeDocumentsController = require('../controllers/employeeDocumentsController')




const verifyJWT= require('../middleware/verifyJWT')
//console.log('here nowwwwwww')

router.use(verifyJWT)
router.route('/:id')//this '/' is not root path but the complementary to previous route
.get(employeeDocumentsController.getFileById)
module.exports = router

router.route('/')//this '/' is not root path but the complementary to previous route
.get(employeeDocumentsController.getAllEmployeeDocuments)
.post(upload.single('file'), employeeDocumentsController.createNewEmployeeDocument)
.patch(employeeDocumentsController.updateEmployeeDocument)
.delete(employeeDocumentsController.deleteEmployeeDocument)


module.exports = router

