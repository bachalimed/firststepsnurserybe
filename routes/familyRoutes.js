const express = require('express')
const router = express.Router()
const familiesController = require('../controllers/familiesController')
const verifyJWT= require('../middleware/verifyJWT')
const Family = require ('../models/Family')


router.use(verifyJWT)


router.route('/:id')//this '/' is not root path but the complementary to previous route
.get(familiesController.getFamilyById)
module.exports = router

router.route('/')//this '/' is now  'students/studentsParents/parents' t because in server.js the route is already admin/users
    .get(familiesController.getAllFamilies)
    .post(familiesController.createNewFamily)
    .patch(familiesController.updateFamily)
    .delete(familiesController.deleteFamily)

module.exports = router