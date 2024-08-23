const express = require('express')
const router = express.Router()
const studentDocumentsListsController = require('../controllers/studentDocumentsListsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is not root path but the complementary to previous route
    .get(studentDocumentsListsController.getAllStudentDocumentsLists)
    .post(studentDocumentsListsController.createNewStudentDocumentsList)
    .patch(studentDocumentsListsController.updateStudentDocumentsList)
    .delete(studentDocumentsListsController.deleteStudentDocumentsList)

module.exports = router