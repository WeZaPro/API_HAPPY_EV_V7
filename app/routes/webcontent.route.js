module.exports = (app) => {
  const router = require("express").Router();
  const { authJwt } = require("../middlewares");
  const controller = require("../controllers/webcontent.controller");
  const upload = require("../middlewares/uploadWebContent");

  // แก้ path router ไม่ให้ชนกับ static
  const apiPrefix = "/api/webcontent";

  router.post(
    "/",
    [authJwt.verifyToken, authJwt.isUser],
    upload.single("image"),
    controller.create
  );
  router.get("/", controller.findAll);
  router.get("/:id", controller.findById);

  router.put(
    "/:id",
    [authJwt.verifyToken, authJwt.isUser],
    upload.single("image"),
    controller.update
  );
  router.delete(
    "/:id",
    [authJwt.verifyToken, authJwt.isUser],
    controller.delete
  );

  app.use(apiPrefix, router);
};
