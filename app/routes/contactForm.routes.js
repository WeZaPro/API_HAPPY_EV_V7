// routes/contactForm.routes.js
const express = require("express");
const router = express.Router();
const contactFormController = require("../controllers/contactForm.controller");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "form-attachments/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

router.post(
  "/contact",
  upload.single("attachment"),
  contactFormController.submit
);

router.get("/contact", contactFormController.getAllContacts);

module.exports = router;
