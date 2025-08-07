const multer = require("multer");
const path = require("path");
const fs = require("fs");
const company = require("../controllers/company.controller.js");
const { authJwt } = require("../middlewares");

const router = require("express").Router();

// สร้างโฟลเดอร์ profile ถ้ายังไม่มี
const uploadFolder = path.join(__dirname, "../profile");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// กำหนด storage ของ multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

// ใช้ upload.single("image") เป็น middleware ของ route create
router.post(
  "/",
  [authJwt.verifyToken, authJwt.isAdmin],
  upload.single("image"),
  company.create
);

router.get("/", [authJwt.verifyToken, authJwt.isAdmin], company.findAll);
router.get("/user", [authJwt.verifyToken, authJwt.isUser], company.findAll);
router.put("/:id", [authJwt.verifyToken, authJwt.isAdmin], company.update);
router.delete("/:id", [authJwt.verifyToken, authJwt.isAdmin], company.delete);

// URL: /api/user-company/company-image-by-email/:email
// router.get(
//   "/company-image-by-email/:email",
//   [authJwt.verifyToken, authJwt.isUser],
//   company.findCompanyImageByUserEmail
// );

router.get(
  "/company-image-by-email/:email",
  // [authJwt.verifyToken, authJwt.isUser, authJwt.isModerator],
  company.findCompanyImageByUserEmail
);

module.exports = (app) => {
  app.use("/api/company", router);
};
