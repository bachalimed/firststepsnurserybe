const express = require('express')
const router = express.Router()
const animatorsAssignmentsController = require('../controllers/animatorsAssignmentsController')
const verifyJWT= require('../middleware/verifyJWT')



router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/animatorsAssigments' t because in server.js the route is already 
    .get(animatorsAssignmentsController.getAllAnimatorsAssignments)
    .post(animatorsAssignmentsController.createNewAnimatorsAssignment)
    .patch(animatorsAssignmentsController.updateAnimatorsAssignment)
    .delete(animatorsAssignmentsController.deleteAnimatorsAssignment)

module.exports = router
