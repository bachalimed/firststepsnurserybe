const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')

router.route('/')//this is now /users
    .get(usersController.getAllUsers)
    .post(usersController.createNewUser)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

module.exports = router