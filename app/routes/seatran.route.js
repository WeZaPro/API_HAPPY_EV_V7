const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authJwt } = require("../middlewares");

const upload_Seatran = multer({ dest: "Seatran/" });
// const { uploadCsvSeatran } = require("../controllers/seatran.controller");

const seatranController = require("../controllers/seatran.controller");
router.post(
  "/upload-csv-Seatran",
  upload_Seatran.single("file"),
  seatranController.uploadCsvSeatran
);

router.get(
  "/get-Seatran",
  [authJwt.verifyToken, authJwt.isUser],
  seatranController.getSeatranData
);

module.exports = router;
