const express = require("express");
const router = express.Router();
const exchangeController = require("../controllers/exchange.controller");

// POST: รับค่าเงินจาก service A
router.post("/save-exchange", exchangeController.saveExchange);
router.get("/exchange", exchangeController.getExchange);

module.exports = router;
