const express = require('express')
const router = express.Router()
const tasksController = require('../controllers/tasksController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)//this will apply to all task route because route.use is in server.js applied before all routes

router.route('/')//this '/' is now  'desk/tasks' because in server.js the route is already admin/users
    .get(tasksController.getAllTasks)
    .post(tasksController.createNewTask)
    .patch(tasksController.updateTask)
    .delete(tasksController.deleteTask)
module.exports = router