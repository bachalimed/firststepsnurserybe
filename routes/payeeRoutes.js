const express = require("express");
const router = express.Router();
const payeesController = require("../controllers/payeesController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router
  .route("/") //this '/' is now  'hr/payees' t because in server.js the route is already
  .get(payeesController.getAllPayees)
  .post(payeesController.createNewPayee)
  .patch(payeesController.updatePayee)
  .delete(payeesController.deletePayee);

module.exports = router;
