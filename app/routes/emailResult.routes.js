const express = require("express");
const router = express.Router();
const { authJwt } = require("../middlewares");

const controller_emailResult = require("../controllers/email_results.controller");

router.post("/import-email-results", controller_emailResult.uploadEmailResults); // ✅ ตรงชื่อแล้ว

router.get(
  "/get-Email",
  [authJwt.verifyToken, authJwt.isUser],
  controller_emailResult.getEmailData
);

module.exports = router;
