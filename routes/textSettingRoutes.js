const express = require("express");
const router = express.Router();
const textSettingsController = require("../controllers/textSettingsController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router
  .route("/") //this '/' is now  'hr/textSettings' t because in server.js the route is already
  .get(textSettingsController.getAllTextSettings)
  .post(textSettingsController.createNewTextSetting)
  .patch(textSettingsController.updateTextSetting)
  .delete(textSettingsController.deleteTextSetting);

module.exports = router;
