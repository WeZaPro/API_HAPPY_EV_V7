const db = require("../models");
const StaffDriver = db.staffDriver;
const axios = require("axios");
// require("dotenv").config();
const pool = require("../config/config.booking");

exports.create_staffDriver = async (req, res) => {
  try {
    const staffDriver_id = `ST-Driver-${String(Date.now()).slice(-6)}`;
    const { driver, phone, line_name, line_user_id } = req.body;

    // 🔍 ตรวจสอบว่า phone หรือ line_user_id ซ้ำหรือไม่
    const existingDriver = await StaffDriver.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ phone }, { line_user_id }],
      },
    });

    if (existingDriver) {
      let duplicateField =
        existingDriver.phone === phone ? "เบอร์โทร" : "LINE User ID";
      return res.status(400).send({
        message: `บัญชีนี้ลงทะเบียนแล้ว (${duplicateField} ซ้ำ)`,
      });
    }

    // ✅ ถ้ายังไม่มีให้สร้างใหม่
    const newStaffDriver = await StaffDriver.create({
      staffDriver_id,
      driver,
      phone,
      line_name,
      line_user_id,
    });

    res.status(201).send(newStaffDriver);
  } catch (err) {
    console.error("🔥 Sequelize error: ", err);
    res.status(500).send({ message: err.message, error: err.errors });
  }
};
exports.getAllStaffDrivers = async (req, res) => {
  try {
    const staffDrivers = await StaffDriver.findAll({
      order: [["createdAt", "DESC"]], // เรียงล่าสุดก่อน (ถ้ามี field createdAt)
    });
    res.status(200).send(staffDrivers);
  } catch (err) {
    console.error("🔥 Sequelize error: ", err);
    res.status(500).send({ message: err.message, error: err.errors });
  }
};
