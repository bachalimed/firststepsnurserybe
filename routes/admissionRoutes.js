const express = require('express')
const router = express.Router()
const admissionsController = require('../controllers/admissionsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/admissions' t because in server.js the route is already 
    .get(admissionsController.getAllAdmissions)
    .post(admissionsController.createNewAdmission)
    .patch(admissionsController.updateAdmission)
    .delete(admissionsController.deleteAdmission)

module.exports = router