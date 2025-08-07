require("dotenv").config(); // โหลด .env ไฟล์
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const fs = require("fs");

const path = require("path");
const uploadDir = "form-attachments";

// const dbConfig = require("./app/config/db.config");

const app = express();

// const JWT_SECRET = process.env.JWT_SECRET;
// const COOKIES_NAME = process.env.COOKIES_NAME;

const JWT_SECRET = "happy_secret_key";
const COOKIES_NAME = "happy_session";

const allowedOrigins = [
  "https://happyevtravelandtransfer.com",
  "https://www.happyevtravelandtransfer.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://booking.wezaapidev.com",
  "https://liff.happyevtravelandtransfer.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("🌍 CORS origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      // ✅ ตอบ origin เดิมกลับไป เพื่อให้ Access-Control-Allow-Origin แสดงค่า origin จริง
      callback(null, origin || "*");
    } else {
      console.error("❌ BLOCKED origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
};

// ✅ ต้องมาก่อนทุก route

// const corsOptions = {
//   origin: "*",
//   credentials: false, // ต้อง false ถ้าใช้ "*"
// };

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// body parser
app.use(express.json());
app.use("/profile", express.static(path.join(__dirname, "app/profile")));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: COOKIES_NAME, //"happy-session",
    secret: JWT_SECRET, //"COOKIE_SECRET_HAPPY", // should use as secret environment variable
    httpOnly: true,
  })
);

const db = require("./app/models");
const Role = db.role;

db.sequelize.sync().then(() => {
  console.log("Synced db.");
  // initial(); // <- เพิ่มตรงนี้
});

//contactForm
// static path สำหรับไฟล์แนบ
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use(
  "/form-attachments",
  express.static(path.join(__dirname, "form-attachments"))
);

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/company.routes")(app);
require("./app/routes/taxiDriver.routes")(app);
require("./app/routes/staffDriver.routes")(app);
require("./app/routes/taxiTransaction.routes")(app);

// เรียกใช้ Router formcontact
app.use("/api", require("./app/routes/contactForm.routes"));

// import routes
const seatranRoutes = require("./app/routes/seatran.route");
app.use("/", seatranRoutes);

const smartryde = require("./app/routes/smartryde.route");
app.use("/", smartryde);

const tuibooking = require("./app/routes/tuibooking.route");
app.use("/", tuibooking);

const email_result = require("./app/routes/emailResult.routes");
app.use("/", email_result);

const save_exchange = require("./app/routes/exchange.routes");
app.use("/", save_exchange);

const agent = require("./app/routes/agent.route");
app.use("/", agent);

const reviewRoutes = require("./app/routes/reviews.route");
app.use("/api/review", reviewRoutes);

const adminController = require("./app/routes/adminControl.route");
app.use("/", adminController);

require("./app/routes/location.route")(app); // ✅ ส่ง app เข้าไป

// 1. static สำหรับไฟล์รูป (แนะนำเปลี่ยน path)
// app.use("/static/webcontent", express.static("webcontent"));
app.use("/webcontent", express.static("webcontent")); // ✅ แค่นี้พอ

// 2. API path ใหม่
require("./app/routes/webcontent.route")(app);

// simple route
app.get("/", async (req, res) => {
  try {
    res.status(200).json({
      message: "API is working!123",
      //user: process.env.DB_USER,
      //password: process.env.DB_PASSWORD,
      //cookie_name: process.env.COOKIES_NAME,
      //db_name: process.env.DB_NAME,
      //jwt: process.env.JWT_SECRET,
      frontend: process.env.FRONTEND_DEV,
    });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// set port, listen for requests
const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}.`);
// });
app
  .listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error("❌ Server error:", err);
    }
  });

function initial() {
  Role.create({ name: "user" });
  Role.create({ name: "moderator" });
  Role.create({ name: "admin" });
}
