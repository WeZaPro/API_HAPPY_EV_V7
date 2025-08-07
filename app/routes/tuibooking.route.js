// routes/tuibooking.route.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/TUIBookings/" });
const { authJwt } = require("../middlewares");
const controller = require("../controllers/tuibooking.controller");

router.post(
  "/upload-csv-tuibooking",
  upload.single("file"),
  controller.uploadTuiBookingCSV // <-- ต้องเป็นฟังก์ชัน ไม่ใช่ object
);

router.get(
  "/get-tuibooking",
  [authJwt.verifyToken, authJwt.isUser],
  controller.getTuiData
);

module.exports = router;
