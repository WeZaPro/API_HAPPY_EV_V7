const express = require("express");
const router = express.Router();

const { authJwt } = require("../middlewares");
const agentController = require("../controllers/adminControl.controller");
//-------Get All
router.get(
  "/AdminGetAllUser",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.getAllUser
);

router.get(
  "/getAllCompany",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.getAllCompany
);

router.get(
  "/getAllTaxiDriver",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.getAllTaxiDriver
);

//-------Update
router.put(
  "/updateCompany/:id",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.updateCompany
);

router.put(
  "/updateTaxiDriver/:id",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.updateTaxiDriver
);

router.put(
  "/updateUser/:id",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.updateUser
);

//-------Get by id

router.get(
  "/getCompanyById/:id",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.getCompanyById
);

router.get(
  "/getTaxiDriverById/:id",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.getTaxiDriverById
);

router.get(
  "/getUserById/:id",
  [authJwt.verifyToken, authJwt.isAdmin], // ← เปิดใช้เมื่อพร้อม auth
  agentController.getUserById
);

module.exports = router; // ✅ <--- สำคัญมาก!
