const pool = require("../config/config.booking");

const db = require("../models");
const StaffDriver = db.staffDriver;
const TaxiDriver = db.taxiDriver;
const TaxiPayment = db.taxiPayment;
const axios = require("axios");

exports.uploadEmailResults = async (req, res) => {
  // สมมติ client ส่งมาแบบ { data: [...] } คือ array ของ object
  const { data } = req.body;
  // console.log("data --> ", data);
  // 👉 generate bookingIdGen ล่วงหน้าให้ตรงกันทุกจุด
  //

  if (!Array.isArray(data)) {
    return res
      .status(400)
      .json({ error: "ข้อมูลต้องเป็น array ใน key 'data'" });
  }

  let connection;
  try {
    if (data.length === 0) {
      return res.status(200).json({ message: "ไม่มีข้อมูลใหม่" });
    }

    connection = await pool.getConnection();
    const today = new Date().toISOString().split("T")[0];
    const [existing] = await connection.query(
      "SELECT Agent_Booking_Id FROM HappyData"
    );
    const existingIds = new Set(existing.map((r) => r.Booking_ID?.trim()));

    const parsedResults = [];
    const duplicateBookings = [];

    for (const item of data) {
      const orderId = item.Order?.trim();
      if (!orderId) continue;

      if (!existingIds.has(orderId)) {
        parsedResults.push(item);
      } else {
        duplicateBookings.push(orderId);
      }
    }

    // ✅ สร้าง bookingId ให้ตรงกันหลังรู้จำนวน parsedResults
    const generatedBookingIds = parsedResults.map(
      (_, i) => `hap${String(Date.now() + i).slice(-6)}`
    );

    // for (const item of parsedResults) {
    // const bookingId = item.Order?.trim();
    for (let i = 0; i < parsedResults.length; i++) {
      const item = parsedResults[i];

      const orderId = item.Order?.trim(); // ใช้บันทึกใน email_results (field `order`)
      // const bookingIdGen = `hap${String(Date.now() + i).slice(-6)}`; // ใช้บันทึกใน HappyData (Booking_ID)
      const bookingIdGen = generatedBookingIds[i]; // ✅ ใช้จาก array ที่สร้างไว้
      const today = new Date().toISOString().split("T")[0];
      const cleanTotal =
        parseFloat((item.Total || "฿0.00").replace(/[฿,]/g, "")) || 0;

      const [taxiRows] = await connection.query(
        `SELECT taxi_id FROM taxiDriver WHERE taxi_lpr = ? LIMIT 1`,
        [item.LPR?.trim()]
      );
      const taxi_id_go = taxiRows.length > 0 ? taxiRows[0].taxi_id : null;

      // ⬇️ INSERT HappyData
      await connection.query(
        `
          INSERT INTO HappyData (
            Booking_ID, Booking_Date, Agent_Booking_Id, Customer_Name, Image_Url,
            AGENT_NAME, AGENT_STAFF_ID, EMAIL, PHONE, START, DESTINATION,
            RETURN_back, PRICE, Date_go, TAXI_id_go, TAXI_lpr_go, Status_go, 
            Date_back, TAXI_id_back, Status_back, Job_status,PAID_go,CONFIRM_go
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          bookingIdGen,
          today,
          orderId,
          item.Employee || "unknown",
          "none",
          item.POS,
          "none",
          "none",
          "none",
          item.form || "none",
          item.to || "none",
          0,
          cleanTotal,
          today,
          taxi_id_go,
          item.LPR || "none",
          "successed",
          null,
          "none",
          "none",
          "complete",
          1,
          "ok",
        ]
      );

      // ⬇️ INSERT email_results
      await connection.query(
        `
          INSERT INTO email_results (
            \`order\`, employee, pos, lpr, destination,
            \`from\`, \`to\`, total, service_date, Happy_Booking_ID
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.Employee,
          item.POS,
          item.LPR,
          item.destination,
          item.form,
          item.to,
          cleanTotal,
          today,
          bookingIdGen,
        ]
      );
    }

    const inserted = parsedResults.length;
    const duplicates = duplicateBookings.length;

    console.log("inserted ", inserted);

    let message = "✅ บันทึกข้อมูลเรียบร้อย";
    if (inserted === 0 && duplicates > 0) {
      message = "⚠️ ไม่มีข้อมูลใหม่ — ทั้งหมดซ้ำแล้ว";
    } else if (duplicates > 0) {
      message += ` (ข้อมูลซ้ำ ${duplicates} รายการ)`;
    }

    // todo ---> save ข้อมูลไป table = TaxiPayment
    // เอาข้อมูลที่รับเข้า LPR: 'ทข 1150 ภูเก็ต', -> find field = taxi_id -> table taxiDriver`
    // ดึงค่าทั้งหมด =
    // วน loop ทุก record ที่ insert ไป HappyData
    //bookingIdGen
    for (let i = 0; i < parsedResults.length; i++) {
      const item = parsedResults[i];
      const lpr = item.LPR?.trim();
      const bookingIdGen = generatedBookingIds[i]; // ✅ bookingId เดิม
      const today = new Date().toISOString().split("T")[0];
      const cleanTotal =
        parseFloat((item.Total || "฿0.00").replace(/[฿,]/g, "")) || 0;

      // ✅ หาข้อมูลจาก taxiDriver
      const taxi = await TaxiDriver.findOne({
        where: {
          taxi_lpr: lpr,
        },
      });

      if (!taxi) {
        console.warn(
          `⚠️ ไม่พบ taxi_lpr: ${lpr} สำหรับ Booking_ID: ${bookingIdGen}`
        );
        continue; // ข้ามรายการนี้
      }

      // ✅ ดึงข้อมูลจาก taxiDriver object
      const { taxi_id, driver, phone, line_user_id, link_staff_id, taxi_lpr } =
        taxi;

      // ✅ สร้างข้อมูลลง TaxiPayment
      await TaxiPayment.create({
        staffDriver_id: link_staff_id || null,
        driver: driver || null,
        phone: phone || null,
        lineId: line_user_id || null,
        taxi_lpr: taxi_lpr || null,
        Booking_ID: bookingIdGen,
        START: item.form || "unknown",
        DESTINATION: item.to || "unknown",
        RETURN_back: false,
        price_send: cleanTotal,
        trip_type: "go",
        trip_date: today,
        status_paid_taxi: false,
      });
    }

    //todo -----end
    // console.log("data  ", data);
    // console.log("data LPR ", data[0].LPR);

    return res.json({
      status: inserted === 0 ? "warning" : "ok",
      message,
      inserted,
      duplicate: duplicates,
      duplicateList: duplicateBookings,
    });
  } catch (err) {
    console.error("❌ Error processing data:", err);
    return res
      .status(500)
      .json({ error: "เกิดข้อผิดพลาด", detail: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// check order id ซ้ำ
async function processNewOrders(newOrders) {
  let existingOrderIds = [];

  try {
    // สมมุติว่าโหลด ID จากฐานข้อมูลมาก่อน
    const existingOrders = await db.order.findAll({
      attributes: ["order_id"],
    });

    existingOrderIds = existingOrders.map((order) => order.order_id);

    // เปรียบเทียบกับ newOrders
    const ordersToInsert = newOrders.filter(
      (order) => !existingOrderIds.includes(order.order_id)
    );

    console.log("🆕 Orders to insert:", ordersToInsert);

    // insert ลง DB ต่อไป...
  } catch (err) {
    console.error("❌ Error processing data:", err);
  }
}

exports.getEmailData = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT
        \`order\`,
        employee,
        pos,
        lpr,
        destination,
        \`from\`,
        \`to\`,
        total,
        service_date,
        Happy_Booking_ID
      FROM email_results
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

// data test postman

// {
//   "data": [
//     {
//       "Order": "03-767",
//       "Employee": "Unknown Unknown",
//       "POS": "POS 3",
//       "LPR": "ทข 1150 ภูเก็ต",
//       "destination": "สนามบิน-บางเทา (AIRPORT-BANGTAO)",
//       "form": "สนามบิน",
//       "to": "บางเทา (AIRPORT-BANGTAO)",
//       "Total": "฿500.00"
//     }
//   ]
// }
