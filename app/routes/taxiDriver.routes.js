// routes/taxiDriver.routes.js

const express = require("express");
const router = express.Router();
const taxiDriver = require("../controllers/taxiDriver.controller");
const { authJwt } = require("../middlewares");

// CRUD Routes
// Admin save
router.post(
  "/",
  [authJwt.verifyToken, authJwt.isAdmin],
  taxiDriver.create_byAdmin
);

router.put(
  "/assignStaffToTaxiDriver",
  // [authJwt.verifyToken, authJwt.isAdmin],
  taxiDriver.assignStaffToTaxiDriver
);

// Driver save
// router.post("/registerDriver", taxiDriver.create_byDriver);
router.get("/", [authJwt.verifyToken, authJwt.isAdmin], taxiDriver.findAll);
router.get("/findByLineUserId/:lineId", taxiDriver.findByLineUserId);

router.get("/user", [authJwt.verifyToken, authJwt.isUser], taxiDriver.findAll);

router.put("/", [authJwt.verifyToken, authJwt.isAdmin], taxiDriver.update);
router.delete("/", [authJwt.verifyToken, authJwt.isAdmin], taxiDriver.delete);

//Todo line ************************
router.post("/line", taxiDriver.handleLineWebhook);

module.exports = (app) => {
  app.use("/api/taxiDriver", router);
};
