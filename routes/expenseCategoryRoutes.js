const express = require('express')
const router = express.Router()
const expenseCategoriesController = require('../controllers/expenseCategoriesController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/expenseCategories' t because in server.js the route is already 
    .get(expenseCategoriesController.getAllExpenseCategories)
    .post(expenseCategoriesController.createNewExpenseCategory)
    .patch(expenseCategoriesController.updateExpenseCategory)
    .delete(expenseCategoriesController.deleteExpenseCategory)

module.exports = router