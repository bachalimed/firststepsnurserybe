const express = require('express')
const router = express.Router()
const leavesController = require('../controllers/leavesController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/leaves' t because in server.js the route is already 
    .get(leavesController.getAllLeaves)
    .post( leavesController.createNewLeave)
    .patch(leavesController.updateLeave)
    .delete( leavesController.deleteLeave)

module.exports = router