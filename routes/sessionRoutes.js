const express = require('express')
const router = express.Router()
const sessionsController = require('../controllers/sessionsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/sessions' t because in server.js the route is already 
    .get(sessionsController.getAllSessions)
    .post(sessionsController.createNewSession)
    .patch(sessionsController.updateSession)
    .delete(sessionsController.deleteSession)

module.exports = router