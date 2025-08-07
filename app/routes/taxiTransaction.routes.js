// routes/taxiTransaction.routes.js

const express = require("express");
const router = express.Router();
const taxiTransaction = require("../controllers/taxiTransaction.controller");
// const reportTaxiTransaction = require("../controllers/reportTaxiTransaction.controller");

const { authJwt } = require("../middlewares");

router.post("/", [authJwt.verifyToken, authJwt.isUser], taxiTransaction.create);
router.get("/", [authJwt.verifyToken, authJwt.isUser], taxiTransaction.findAll);
router.put("/", [authJwt.verifyToken, authJwt.isUser], taxiTransaction.update);
router.delete(
  "/",
  [authJwt.verifyToken, authJwt.isUser],
  taxiTransaction.delete
);

// router.get(
//   "/withDriver",
//   [authJwt.verifyToken, authJwt.isUser], // หรือใส่ authJwt.isAdmin ถ้าต้องการ
//   reportTaxiTransaction.findAllWithDriver
// );

// router.put(
//   "/updatePaidStatus/:Happy_Booking_ID",
//   [authJwt.verifyToken, authJwt.isUser],
//   reportTaxiTransaction.updatePaidStatus
// );

module.exports = (app) => {
  app.use("/api/taxiTransaction", router);
};
