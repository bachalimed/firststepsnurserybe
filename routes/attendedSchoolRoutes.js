const express = require('express')
const router = express.Router()
const attendedSchoolsController = require('../controllers/attendedSchoolsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'attendedSchools/attendedSchoolsParents/attendedSchools' because in server.js the route is already admin/users
    .get(attendedSchoolsController.getAllAttendedSchools)
    .post(attendedSchoolsController.createNewAttendedSchool)
    .patch(attendedSchoolsController.updateAttendedSchool)
    .delete(attendedSchoolsController.deleteAttendedSchool)

module.exports = router