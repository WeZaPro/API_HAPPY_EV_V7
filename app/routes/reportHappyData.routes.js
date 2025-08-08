const express = require("express");
const router = express.Router();
const reportHappyData = require("../controllers/reportHappyData.controller");
const { authJwt } = require("../middlewares");

router.get(
  "/findAllTaxi",
  [authJwt.verifyToken, authJwt.isUser],
  reportHappyData.findAllTaxi
);
router.get(
  "/findAllAgent",
  [authJwt.verifyToken, authJwt.isUser],
  reportHappyData.findAllAgent
);
router.post(
  "/getReportDataLineChart",
  [authJwt.verifyToken, authJwt.isUser],
  reportHappyData.getReportAgentLineChart
);
router.post(
  "/getReportDoughnutChart",
  [authJwt.verifyToken, authJwt.isUser],
  reportHappyData.getReportAgentDoughnutChart
);

router.post(
  "/getReportTaxiPaymentLineChart",
  [authJwt.verifyToken, authJwt.isUser],
  reportHappyData.getReportTaxiPaymentLineChart
);

router.post(
  "/getReportTaxiPaymentDoughnutChart",
  [authJwt.verifyToken, authJwt.isUser],
  reportHappyData.getReportTaxiPaymentDoughnutChart
);

module.exports = router;
