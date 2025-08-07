// controllers/seatran.controller.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const pool = require("../config/config.booking");

exports.uploadCsvSeatran = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "กรุณาอัปโหลดไฟล์ .csv" });

  const filePath = path.resolve(req.file.path);
  const today = new Date().toISOString().split("T")[0];
  const parsedResults = [];
  const duplicateBookings = [];

  let connection;
  try {
    connection = await pool.getConnection();

    // ดึง Booking_ID ที่มีอยู่แล้วใน Seatran
    const [existing] = await connection.query("SELECT Booking_ID FROM Seatran");
    const existingIds = new Set(existing.map((r) => r.Booking_ID?.trim()));

    // อ่าน CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          const bookingId = row["Booking ID"]?.trim();
          if (bookingId) {
            const cleanedRow = {
              Booking_ID: bookingId,
              pickup: row["Place for pick up"]?.trim() || "",
              dropoff: row["Place for drop off"]?.trim() || "",
              guest: row["Guest Name"]?.trim() || "",
            };

            if (!existingIds.has(bookingId)) {
              parsedResults.push(cleanedRow); // ไม่ซ้ำ
            } else {
              duplicateBookings.push(bookingId); // ซ้ำ
            }
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    fs.unlinkSync(filePath); // ลบไฟล์หลังใช้งาน

    // Insert เฉพาะรายการที่ไม่ซ้ำ
    for (let i = 0; i < parsedResults.length; i++) {
      const item = parsedResults[i];
      const bookingId = `hap${String(Date.now() + i).slice(-6)}`;

      // ✅ INSERT HappyData
      await connection.query(
        `
        INSERT INTO HappyData (
          Booking_ID, Booking_Date, Agent_Booking_Id, Customer_Name, Image_Url,
          AGENT_NAME, AGENT_STAFF_ID, EMAIL, PHONE, START, DESTINATION,
          RETURN_back, PRICE, Date_go, TAXI_id_go, Status_go, Date_back,
          TAXI_id_back, Status_back, Job_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          bookingId,
          today,
          item.Booking_ID,
          item.guest,
          "none",
          "Seatran",
          "none",
          "none",
          "none",
          item.pickup,
          item.dropoff,
          0,
          0.0,
          null,
          "none",
          "planning",
          null,
          "none",
          "none",
          "hold",
        ]
      );

      // ✅ INSERT Seatran
      await connection.query(
        `
        INSERT INTO Seatran (Booking_ID, Place_for_pick_up, Guest_Name, Place_for_drop_off,service_date, Happy_Booking_ID)
        VALUES (?, ?, ?, ?, ?,?)
        `,
        [
          item.Booking_ID,
          item.pickup,
          item.guest,
          item.dropoff,
          today,
          bookingId,
        ]
      );
    }

    // สรุปผลลัพธ์
    const total = parsedResults.length + duplicateBookings.length;
    const inserted = parsedResults.length;
    const duplicates = duplicateBookings.length;

    let message = "✅ อัปโหลด Seatran เรียบร้อย";
    if (inserted === 0 && duplicates > 0) {
      message = "⚠️ ไม่มีรายการใหม่ — ข้อมูลทั้งหมดซ้ำกับระบบแล้ว";
    } else if (duplicates > 0) {
      message += ` (มีข้อมูลซ้ำ ${duplicates} รายการ)`;
    }

    res.json({
      status: inserted === 0 ? "warning" : "ok",
      message,
      inserted,
      duplicate: duplicates,
      duplicateList: duplicateBookings,
    });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด", detail: err.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.getSeatranData = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT 
        Booking_ID,
        Place_for_pick_up,
        Guest_Name,
        Place_for_drop_off,
        service_date,
        Happy_Booking_ID
        
      FROM Seatran
      ORDER BY service_date DESC
    `);

    res.json({
      status: "ok",
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด", detail: err.message });
  } finally {
    if (connection) connection.release();
  }
};
