const express = require('express')
const router = express.Router()
const parentsController = require('../controllers/parentsController')
const verifyJWT= require('../middleware/verifyJWT')
const Parent = require ('../models/Parent')


router.use(verifyJWT)

router.route('/')//this '/' is now  'students/studentsParents/parents' t because in server.js the route is already admin/users
    .get(parentsController.getAllParents)
    .post(parentsController.createNewParent)
    .patch(parentsController.updateParent)
    .delete(parentsController.deleteParent)

module.exports = router