const express = require('express')
const router = express.Router()
const animatorsAssigmentsController = require('../controllers/animatorsAssigmentsController')
const verifyJWT= require('../middleware/verifyJWT')



router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/animatorsAssigments' t because in server.js the route is already 
    .get(animatorsAssigmentsController.getAllAnimatorsAssigments)
    .post(animatorsAssigmentsController.createNewAnimatorsAssigment)
    .patch(animatorsAssigmentsController.updateAnimatorsAssigment)
    .delete(animatorsAssigmentsController.deleteAnimatorsAssigment)

module.exports = router
