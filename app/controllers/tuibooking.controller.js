// controllers/tuibooking.controller.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const pool = require("../config/config.booking");

// แปลงวันที่ mm/dd/yyyy => yyyy-mm-dd
function formatDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [month, day, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// แปลงเวลา เช่น "16:10" => "16:10:00"
function formatTime(timeStr) {
  if (!timeStr) return null;
  return timeStr.includes(":") ? `${timeStr}:00` : null;
}

exports.uploadTuiBookingCSV = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "กรุณาอัปโหลดไฟล์ .csv" });

  const filePath = path.resolve(req.file.path);
  const today = new Date().toISOString().split("T")[0];
  const parsedResults = [];
  const duplicateBookings = [];
  let connection;

  try {
    connection = await pool.getConnection();

    // อ่าน CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => parsedResults.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    fs.unlinkSync(filePath); // ลบไฟล์หลังใช้งาน

    // วนลูป insert
    for (let i = 0; i < parsedResults.length; i++) {
      const item = parsedResults[i];
      const bookingId = `hap${String(Date.now() + i).slice(-6)}`;

      // 🔍 ตรวจสอบว่ามี Agent_Booking_Id ซ้ำใน HappyData หรือไม่
      const [existingRows] = await connection.query(
        `SELECT 1 FROM HappyData WHERE Agent_Booking_Id = ? LIMIT 1`,
        [item.Booking]
      );

      if (existingRows.length > 0) {
        duplicateBookings.push(item.Booking); // ❌ ถ้าซ้ำ ให้เก็บไว้
        continue; // ข้าม insert
      }

      // ✅ Insert HappyData
      await connection.query(
        `INSERT INTO HappyData (
          Booking_ID, Booking_Date, Agent_Booking_Id, Customer_Name,
          AGENT_NAME, START, DESTINATION
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          today,
          item.Booking,
          item["General name"] || "",
          "TUI",
          item.Origin || "",
          item.Destination || "",
        ]
      );

      // ✅ Insert TUIBookings
      await connection.query(
        `INSERT INTO TUIBookings (
          Booking, Ref_TO, TourOperator, Supplier, Transfer_Date, Transfer_Type, Service_Type,
          Origin, Destination, Hotel_Code, Hotel_Name, General_Name, Adult, Children, Infant,
          Flight_Number, Flight_Time, Incoming_Statement, Incoming_Planning, Billing_Code,
          Bus_Code, Vehicle_Type, Operator_Vehicle, Pickup_Time, Supplier_Statement_Remarks,
          Order_Code, Guide_Name, TO_Booking_Remarks, Supplier_Booking_Remarks, Pax_Names,
          Happy_Booking_ID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.Booking,
          item["Ref.TO"],
          item.Touroperator,
          item.Supplier,
          formatDate(item["Transf.Date"]),
          item["Trans. Type"],
          item["Type Serv."],
          item.Origin,
          item.Destination,
          item["Cod. Hotel"],
          item.Hotel,
          item["General name"],
          parseInt(item.Adult) || 0,
          parseInt(item.Children) || 0,
          parseInt(item.Inf) || 0,
          item["Flight Num."],
          formatTime(item["Flight time"]),
          item["Incoming Statement"],
          item["Incoming Planning"],
          item["Billing Code"],
          item["Bus Code"],
          item["Vehicle Type"],
          item["Op. Veh."] || "",
          item["Pickup Time"]
            ? new Date(
                formatDate(item["Pickup Time"].split(" ")[0]) +
                  "T" +
                  formatTime(item["Pickup Time"].split(" ")[1])
              )
            : null,
          item["Sup. Statement remarks"],
          item.Order,
          item.Guide,
          item["TO Booking remarks"],
          item["Sup. Booking remarks"],
          item["Pax Names"],
          bookingId,
        ]
      );
    }

    // ✅ สรุปผลลัพธ์
    const total = parsedResults.length;
    const duplicates = duplicateBookings.length;
    const inserted = total - duplicates;

    let message = "✅ อัปโหลด TUI Bookings เรียบร้อย";
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

exports.getTuiData = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT
       Booking,
      Ref_TO,
      TourOperator,
      Supplier,
      Transfer_Date,
      Transfer_Type,
      Service_Type,
      Origin,
      Hotel_Code,
      Hotel_Name,
      General_Name,
      Adult,
      Children,
      Flight_Number,
      Flight_Time,
      Incoming_Statement,
      Incoming_Planning,
      Billing_Code,
      Order_Code,
      Billing_Code,
      Pax_Names,
        Happy_Booking_ID
      FROM TUIBookings
      ORDER BY Transfer_Date DESC
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
