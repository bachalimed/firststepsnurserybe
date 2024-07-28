const express = require('express')
const router = express.Router()
const employeesController = require('../controllers/employeesController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/employees' t because in server.js the route is already 
    .get(employeesController.getAllEmployees)
    .post(employeesController.createNewEmployee)
    .patch(employeesController.updateEmployee)
    .delete(employeesController.deleteEmployee)

module.exports = router