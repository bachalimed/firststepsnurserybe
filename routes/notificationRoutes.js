const express = require('express')
const router = express.Router()
const notificationsController = require('../controllers/notificationsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/notifications' t because in server.js the route is already 
    .get(notificationsController.getAllNotifications)
    .post(notificationsController.createNewNotification)
    .patch(notificationsController.updateNotification)
    .delete(notificationsController.deleteNotification)

module.exports = router