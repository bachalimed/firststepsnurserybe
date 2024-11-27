const express = require('express')
const router = express.Router()
const expensesController = require('../controllers/expensesController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/expenses' t because in server.js the route is already 
    .get(expensesController.getAllExpenses)
    .post(expensesController.createNewExpense)
    .patch(expensesController.updateExpense)
    .delete(expensesController.deleteExpense)

module.exports = router