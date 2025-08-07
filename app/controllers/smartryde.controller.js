// controllers/smartryde.controller.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const pool = require("../config/config.booking");

// ฟังก์ชันแปลงวันที่จาก "20-Jun-2025" → "2025-06-20"
function formatDateToISO(dateStr) {
  if (!dateStr) return null;

  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;

  const day = parts[0].padStart(2, "0");
  const mon = months[parts[1]];
  const year = parts[2];

  if (!mon) return null;

  return `${year}-${mon}-${day}`;
}

exports.uploadSmartRydeCSV = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "กรุณาอัปโหลดไฟล์ .csv" });

  const filePath = path.resolve(req.file.path);
  const today = new Date().toISOString().split("T")[0];
  const parsedResults = [];
  const duplicateBookings = [];

  let connection;
  try {
    connection = await pool.getConnection();

    // อ่าน booking_code ที่มีอยู่ใน SmartRyde แล้ว
    const [existing] = await connection.query(
      "SELECT booking_code FROM SmartRyde"
    );
    const existingCodes = new Set(existing.map((r) => r.booking_code?.trim()));

    // อ่านและกรอง CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          const code = row.booking_code?.trim() || row["Booking_ID"]?.trim();
          if (code) {
            row.booking_code = code;
            if (!existingCodes.has(code)) {
              parsedResults.push(row); // ใหม่
            } else {
              duplicateBookings.push(code); // ซ้ำ
            }
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    fs.unlinkSync(filePath); // ลบไฟล์หลังใช้งาน

    // วนลูป insert เฉพาะที่ไม่ซ้ำ
    for (let i = 0; i < parsedResults.length; i++) {
      const item = parsedResults[i];
      const bookingId = `hap${String(Date.now() + i).slice(-6)}`;

      const serviceDateISO = formatDateToISO(item.service_date);

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
          item.booking_code || "",
          item.traveler_name || "",
          "none", // Image_Url
          "SmartRyde", // AGENT_NAME
          "none", // AGENT_STAFF_ID
          "none", // EMAIL
          "none", // PHONE
          item.pick_up || "", // START
          item.drop_off || "", // DESTINATION
          0, // RETURN_back
          0.0, // PRICE
          null, //null, // Date_go
          "none", // TAXI_id_go
          "planning", // Status_go
          null, //null, // Date_back
          "none", // TAXI_id_back
          "none", // Status_back
          "hold", // Job_status
        ]
      );

      // ✅ INSERT SmartRyde
      await connection.query(
        `
        INSERT INTO SmartRyde (
          booking_code, traveler_name, traveler_mobile, external_ref_no, service_date, service_time,
          pick_up, drop_off, iata, car_type, passengers, special_request,
          arrival_flight_number, supplier_name, Happy_Booking_ID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          item.booking_code,
          item.traveler_name,
          item.traveler_mobile,
          item.external_ref_no,
          serviceDateISO,
          item.service_time,
          item.pick_up,
          item.drop_off,
          item.iata,
          item.car_type,
          item.passengers,
          item.special_request,
          item.arrival_flight_number,
          item.supplier_name,
          bookingId,
        ]
      );
    }

    // ✅ สรุปผลลัพธ์
    const total = parsedResults.length + duplicateBookings.length;
    const inserted = parsedResults.length;
    const duplicates = duplicateBookings.length;

    let message = "✅ อัปโหลด SmartRyde เรียบร้อย";
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

exports.getSmartRydeData = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT 
        booking_code,
        traveler_name,
        traveler_mobile,
        external_ref_no,
        service_date,
        service_time,
        pick_up,
        drop_off,
        iata,
        car_type,
        passengers,
        special_request,
        arrival_flight_number,
        supplier_name,
        Happy_Booking_ID
      FROM SmartRyde
      ORDER BY service_date DESC, service_time ASC
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
