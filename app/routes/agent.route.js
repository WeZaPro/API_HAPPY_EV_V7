const express = require("express");
const router = express.Router();

const { authJwt } = require("../middlewares");
const agentController = require("../controllers/agent.controller");
// happy ************ start **********************

// 🔐 ใส่ middleware auth ถ้าต้องการ
router.get(
  "/getCompanyNameFromCompanyCode",
  [authJwt.verifyToken, authJwt.isModerator],
  agentController.getCompanyNameFromCompanyCode
);

router.get(
  "/agent",
  [authJwt.verifyToken, authJwt.isModerator],
  agentController.getAllUsersWithCompany
);

router.get(
  "/ModData",
  [authJwt.verifyToken, authJwt.isModerator],
  agentController.getAllBookings
);

router.get(
  "/AdminGetCompany",
  [authJwt.verifyToken, authJwt.isAdmin],
  agentController.getAllUsersWithCompany
);

router.post("/web", agentController.createBookingFromWeb);

router.post(
  "/agent",
  [authJwt.verifyToken, authJwt.isModerator],
  agentController.createBooking
);

router.post(
  "/HappyBooking",
  [authJwt.verifyToken, authJwt.isUser],
  agentController.createBooking
);
// partner ************ end

// happy ************ start **********************
// ดึงข้อมูลทั้งหมด
router.get(
  "/happydata",
  [authJwt.verifyToken, authJwt.isUser],
  agentController.getAllBookings
);

// ดึงข้อมูล Booking เดียว
router.get(
  "/happydata/:bookingId",
  [authJwt.verifyToken, authJwt.isUser],
  agentController.getBookingById
);

// ดึงข้อมูล Booking queryBookingTaxi
router.get(
  "/queryBookingTaxi",
  [authJwt.verifyToken, authJwt.isUser],
  agentController.queryBookingTaxi
);

// อัปเดตข้อมูล Booking
router.put(
  "/happydata/:bookingId",
  [authJwt.verifyToken, authJwt.isUser],
  agentController.updateBookingById
);

// update paid status
router.put(
  "/updatePaidStatus/:Happy_Booking_ID",
  [authJwt.verifyToken, authJwt.isUser],
  agentController.updatePaidStatus
);

// get taxi payment
router.get(
  "/getAllTaxiPayments",
  [authJwt.verifyToken, authJwt.isAdmin],
  agentController.getAllTaxiPayments
);

router.get(
  "/userGetAllTaxiPayments",
  [authJwt.verifyToken, authJwt.isUser],
  agentController.getAllTaxiPayments
);

// confirm from taxi
router.put(
  "/confirmTaxi/:Happy_Booking_ID",
  // [authJwt.verifyToken, authJwt.isUser],
  agentController.confirmTaxi
);

router.post(
  "/lineToDriver/:Happy_Booking_ID",
  // [authJwt.verifyToken, authJwt.isUser],
  agentController.lineToDriver
);

router.get(
  "/getLineTaxiPayments/:id",
  // [authJwt.verifyToken, authJwt.isAdmin],
  agentController.getLineTaxiPayments
);

// happy ************ end
module.exports = router;
