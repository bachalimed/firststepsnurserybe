const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)
console.log('in the routes of user now')

router.route('/')//this '/' is now  '/admin/users' t because in server.js the route is already admin/users
    .get(usersController.getAllUsers)
    //.post(usersController.createNewUser) this was moved to muller becasue of the upload of photo
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

module.exports = router