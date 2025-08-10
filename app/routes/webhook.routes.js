const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");

router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // raw body สำหรับ Stripe
  webhookController.handleWebhook
);

module.exports = router;

// test webhook
//stripe listen --forward-to http://localhost:3000/webhook
//stripe trigger checkout.session.completed
