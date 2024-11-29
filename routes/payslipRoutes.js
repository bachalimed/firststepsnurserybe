const express = require('express')
const router = express.Router()
const payslipsController = require('../controllers/payslipsController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/payslips' t because in server.js the route is already 
    .get(payslipsController.getAllPayslips)
    .post(payslipsController.createNewPayslip)
    .patch(payslipsController.updatePayslip)
    .delete(payslipsController.deletePayslip)

module.exports = router