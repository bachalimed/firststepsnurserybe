const express = require('express')
const router = express.Router()
const tasksController = require('../controllers/tasksController')

router.route('/')//this '/' is now  'desk/tasks' because in server.js the route is already admin/users
    .get(tasksController.getAllTasks)
    .post(tasksController.createNewTask)
    .patch(tasksController.updateTask)
    .delete(tasksController.deleteTask)
module.exports = router