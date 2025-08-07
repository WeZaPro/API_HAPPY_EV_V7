// routes/smartryde.route.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/SmartRyde/" });
const { authJwt } = require("../middlewares");

const smartRydeController = require("../controllers/smartryde.controller");

router.post(
  "/upload-csv-SmartRyde",
  upload.single("file"),
  [authJwt.verifyToken, authJwt.isUser],
  smartRydeController.uploadSmartRydeCSV
);

router.get(
  "/get-SmartRyde",
  [authJwt.verifyToken, authJwt.isUser],
  smartRydeController.getSmartRydeData
);

module.exports = router;
