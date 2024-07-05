const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')

router.route('/')//this '/' is now  '/admin/users' t because in server.js the route is already admin/users
    .get(usersController.getAllUsers)
    .post(usersController.createNewUser)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

module.exports = router