const express = require('express')
const router = express.Router()
const invoicesController = require('../controllers/invoicesController')
const verifyJWT= require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')//this '/' is now  'hr/invoices' t because in server.js the route is already 
    .get(invoicesController.getAllInvoices)
    .post(invoicesController.createNewInvoice)
    .patch(invoicesController.updateInvoice)
    .delete(invoicesController.deleteInvoice)

module.exports = router