const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { authJwt } = require("../middlewares");

router.post(
  "/",
  [authJwt.verifyToken, authJwt.isUser],
  reviewController.create
);

router.get(
  "/",
  [authJwt.verifyToken, authJwt.isUser],
  reviewController.findAll
);

router.get("/use", reviewController.findAllUse);

router.get(
  "/:id",
  [authJwt.verifyToken, authJwt.isUser],
  reviewController.findById
);

router.put(
  "/:id",
  [authJwt.verifyToken, authJwt.isUser],
  reviewController.update
);

router.delete(
  "/:id",
  [authJwt.verifyToken, authJwt.isUser],
  reviewController.delete
);

module.exports = router;
