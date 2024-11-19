const express = require('express')
const router = express.Router()
const employeeDocumentsListsController = require('../controllers/employeeDocumentsListsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is not root path but the complementary to previous route
    .get(employeeDocumentsListsController.getAllEmployeeDocumentsLists)
    .post(employeeDocumentsListsController.createNewEmployeeDocumentsList)
    .patch(employeeDocumentsListsController.updateEmployeeDocumentsList)
    .delete(employeeDocumentsListsController.deleteEmployeeDocumentsList)

module.exports = router