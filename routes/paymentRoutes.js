const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/paymentsController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router
  .route("/") //this '/' is now  'hr/payments' t because in server.js the route is already
  .get(paymentsController.getAllPayments)
  .post(paymentsController.createNewPayment)
  .patch(paymentsController.updatePayment)
  .delete(paymentsController.deletePayment);

module.exports = router;
