const express = require("express");
const router = express.Router();
const location = require("../controllers/location.controller");
const { authJwt } = require("../middlewares");

// 👉 POST /api/location
router.post("/", [authJwt.verifyToken, authJwt.isUser], location.create);

// 👉 GET /api/location
router.get("/", location.findAll);

// 👉 GET /api/location
router.get("/menu", location.findUseMenu);

// 👉 GET /api/location/:id
router.get("/:id", location.findById);

// 👉 PUT /api/location/:id
router.put("/:id", [authJwt.verifyToken, authJwt.isUser], location.update);

//========== table จับคู่ ==========
//
router.post("/findPrice", location.findPrice);
router.post("/findPriceAll", location.findPriceAll);
// อัปเดตราคา route pair by id
router.put(
  "/route-pairs/:id/price",
  [authJwt.verifyToken, authJwt.isUser],
  location.updatePrice
);

// ลบ route pair by id //todo ไม่ใช้ ให้ disble location หลักแทน
router.delete(
  "/route-pairs/:id",
  [authJwt.verifyToken, authJwt.isUser],
  location.deleteRoutePair
);

module.exports = (app) => {
  app.use("/api/location", router);
};
