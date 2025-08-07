const pool = require("../config/config.booking");
const db = require("../models"); // โหลด Sequelize models ทั้งหมด
const TaxiDriver = db.taxiDriver; // เรียกใช้ taxiDriver model
const StaffDriver = db.staffDriver; // เรียกใช้ taxiDriver model
const TaxiPayment = db.taxiPayment; // เรียกใช้ taxiDriver model

// 👇 import ฟังก์ชันจากไฟล์ utils
const { sendLineNotify } = require("../utils/sendLineNotify");

exports.getCompanyNameFromCompanyCode = async (req, res) => {
  const { company_code } = req.query;

  if (!company_code) {
    return res.status(400).json({ error: "ต้องส่ง company_code มาด้วย" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      `
      SELECT *
      FROM HappyData
      WHERE AGENT_NAME LIKE CONCAT('%[', ?, ']%')
    `,
      [company_code]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "ไม่พบข้อมูลบริษัทที่ใช้ company_code นี้" });
    }

    res.json({
      company_code,
      count: rows.length,
      matched_data: rows, // ✅ ส่งทุก column ที่ match กลับไป
    });
  } catch (err) {
    console.error("❌ getCompanyNameFromCompanyCode error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  } finally {
    if (conn) conn.release();
  }
};

// partner ************ start
exports.getAllUsersWithCompany = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(`
          SELECT 
            u.id, u.username, u.email, u.status,
            u.company_code,
            c.company_name AS company_name,
            c.image_url AS company_image_url,
            c.code_emp AS company_code_emp
          FROM users u
          LEFT JOIN company c ON u.company_code = c.company_code
        `);
    console.log("data ", rows);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching users with company:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  } finally {
    if (conn) conn.release();
  }
};

exports.createBookingFromWeb = async (req, res) => {
  const {
    guest, //
    pickup, //
    dropoff, //
    AGENT_STAFF_ID,
    EMAIL, //
    PHONE, //
    RETURN_back, //
    PRICE, //
    Date_go, //
    Date_back, //
    companyName,
  } = req.body;

  // รับค่าจาก web
  //===================================
  // currencySymbol ("$")
  // dateTime = Date_go
  // email = EMAIL
  // firstName + " " +lastName + [gender]+[country]= guest
  // mobile = PHONE
  // price = PRICE
  // returnning = RETURN_back (true/false)
  // returnDateTime = Date_back
  // start = pickup
  // destination = dropoff
  //===================================
  // const userId = req.userId; // ได้จาก middleware
  // console.log("guest ", guest);

  // ✅ ตรวจสอบค่าบังคับ
  if (!guest || !pickup || !dropoff) {
    return res
      .status(400)
      .json({ error: "กรุณาส่งข้อมูล guest, pickup, dropoff ให้ครบถ้วน" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 🧠 Generate ID
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const bookingId = `hap${String(Date.now()).slice(-6)}`;
    const agentBookingId = `web_${now
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 13)}`;

    // ✅ แปลงค่าที่รับมา
    const returnBack = RETURN_back === true || RETURN_back === 1 ? 1 : 0;
    const price = parseFloat(PRICE) || 0;
    const dateGo = Date_go ? new Date(Date_go) : null;
    const dateBack = Date_back ? new Date(Date_back) : null;

    // 📝 Insert HappyData
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
        agentBookingId,
        guest,
        "none",
        "HappyEv-WEB", //setCodeCompany, //companyName,//AGENT_NAME
        AGENT_STAFF_ID || "none",
        EMAIL || "none",
        PHONE || "none",
        pickup,
        dropoff,
        returnBack,
        price,
        dateGo,
        "none",
        "planning",
        dateBack,
        "none",
        "none",
        "hold",
      ]
    );

    res.status(201).json({
      message: "✅ Booking สร้างเรียบร้อย",
      Happy_Booking_ID: bookingId,
      Agent_Booking_Id: agentBookingId,
      AGENT_NAME: companyName,
    });
  } catch (err) {
    console.error("❌ Error creating booking:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด", detail: err.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.createBooking = async (req, res) => {
  const {
    guest,
    pickup,
    dropoff,
    AGENT_STAFF_ID,
    EMAIL,
    PHONE,
    RETURN_back,
    PRICE,
    Date_go,
    Date_back,
  } = req.body;

  const userId = req.userId; // ได้จาก middleware
  console.log("guest ", guest);

  // ✅ ตรวจสอบค่าบังคับ
  if (!guest || !pickup || !dropoff) {
    return res
      .status(400)
      .json({ error: "กรุณาส่งข้อมูล guest, pickup, dropoff ให้ครบถ้วน" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 🔍 ดึงข้อมูลผู้ใช้งานและบริษัท
    const [users] = await connection.query(
      `
        SELECT u.id, u.username, u.email, u.company_code,
               c.company_name
        FROM users u
        LEFT JOIN company c ON u.company_code = c.company_code
        WHERE u.id = ?
        `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });
    }

    const user = users[0];
    const companyName = user.company_name || "unknown";
    const companyCode = user.company_code || "unknown";
    const setCodeCompany = companyName + " [" + companyCode + "]";

    // 🧠 Generate ID
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const bookingId = `hap${String(Date.now()).slice(-6)}`;
    const agentBookingId = `agent_${now
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 13)}`;

    // ✅ แปลงค่าที่รับมา
    const returnBack = RETURN_back === true || RETURN_back === 1 ? 1 : 0;
    const price = parseFloat(PRICE) || 0;
    const dateGo = Date_go ? new Date(Date_go) : null;
    const dateBack = Date_back ? new Date(Date_back) : null;

    // 📝 Insert HappyData
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
        agentBookingId,
        guest,
        "none",
        setCodeCompany, //companyName,//AGENT_NAME
        AGENT_STAFF_ID || "none",
        EMAIL || "none",
        PHONE || "none",
        pickup,
        dropoff,
        returnBack,
        price,
        dateGo,
        "none",
        "planning",
        dateBack,
        "none",
        "none",
        "hold",
      ]
    );

    res.status(201).json({
      message: "✅ Booking สร้างเรียบร้อย",
      Happy_Booking_ID: bookingId,
      Agent_Booking_Id: agentBookingId,
      AGENT_NAME: companyName,
    });
  } catch (err) {
    console.error("❌ Error creating booking:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด", detail: err.message });
  } finally {
    if (connection) connection.release();
  }
};
// partner ************ end *************************

// happy ************ start *************************
//
// READ ALL: ดึงข้อมูลทั้งหมดจาก HappyData
exports.getAllBookings = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      `SELECT * FROM HappyData ORDER BY ID DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching all bookings:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  } finally {
    if (connection) connection.release();
  }
};

// READ (Get one record by Booking_ID)
exports.getBookingById = async (req, res) => {
  const bookingId = req.params.bookingId;
  console.log("bookingId ", bookingId);

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      `SELECT * FROM HappyData WHERE Booking_ID = ?`,
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูล Booking นี้" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching booking:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateBookingById = async (req, res) => {
  const bookingId = req.params.bookingId;
  const updateData = req.body;

  console.log("📦 updateData:", updateData);

  let connection;
  try {
    connection = await pool.getConnection();

    // 🔎 ตรวจสอบว่า Booking นี้มีอยู่หรือไม่
    const [existing] = await connection.query(
      `SELECT * FROM HappyData WHERE Booking_ID = ?`,
      [bookingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "❌ ไม่พบข้อมูล Booking นี้" });
    }

    // 🧩 สร้าง query แบบ dynamic สำหรับอัปเดต
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    const sql = `UPDATE HappyData SET ${fields} WHERE Booking_ID = ?`;

    // 🔄 อัปเดตข้อมูล
    await connection.query(sql, [...values, bookingId]);

    res.json({ message: "✅ อัปเดตข้อมูลสำเร็จ" });
  } catch (err) {
    console.error("❌ Error updating booking:", err);
    res.status(500).json({
      error: "เกิดข้อผิดพลาด",
      detail: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

exports.queryBookingTaxi = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const { startDate, endDate, agent } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (startDate && endDate) {
      whereClause += " AND Booking_Date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    if (agent) {
      whereClause += " AND AGENT_NAME = ?";
      params.push(agent);
    }

    // ดึงข้อมูลดิบจาก DB
    const [rawData] = await connection.query(
      `SELECT * FROM HappyData ${whereClause} ORDER BY Booking_ID DESC`,
      params
    );

    // ✅ แปลงข้อมูล
    const formattedData = [];
    rawData.forEach((item) => {
      // --- Row เที่ยวไป
      formattedData.push({
        ID: item.ID,
        Booking_ID: item.Booking_ID,
        Booking_Date: item.Booking_Date,
        Agent_Booking_Id: item.Agent_Booking_Id,
        Customer_Name: item.Customer_Name,
        AGENT_NAME: item.AGENT_NAME,
        RETURN_back: item.RETURN_back,
        START: item.START,
        DESTINATION: item.DESTINATION,
        PRICE: item.PRICE,
        Job_status: item.Job_status,
        trip_type: "go",
        trip_date: item.Date_go,
        taxi_id: item.TAXI_id_go,
        taxi_lpr: item.TAXI_lpr_go,
        status: item.Status_go,
        paid: item.PAID_go,
        confirm: item.CONFIRM_go,
        PAID_go: item.PAID_go,
        PAID_back: item.PAID_back,
      });

      // --- Row เที่ยวกลับ (ถ้ามี RETURN_back = 1)
      if (item.RETURN_back === 1) {
        formattedData.push({
          ID: item.ID,
          Booking_ID: item.Booking_ID,
          Booking_Date: item.Booking_Date,
          Agent_Booking_Id: item.Agent_Booking_Id,
          Customer_Name: item.Customer_Name,
          AGENT_NAME: item.AGENT_NAME,
          RETURN_back: item.RETURN_back,
          START: item.DESTINATION, // สลับเส้นทาง
          DESTINATION: item.START,
          PRICE: item.PRICE,
          Job_status: item.Job_status,
          trip_type: "back",
          trip_date: item.Date_back,
          taxi_id: item.TAXI_id_back,
          taxi_lpr: item.TAXI_lpr_back,
          status: item.Status_back,
          paid: item.PAID_back,
          confirm: item.CONFIRM_back,
        });
      }
    });

    res.json(formattedData);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  } finally {
    if (connection) connection.release();
  }
};

exports.updatePaidStatus = async (req, res) => {
  try {
    const { Happy_Booking_ID } = req.params;
    const updateFields = req.body;

    const taxiId = updateFields?.data?.taxi_id;

    let phone = null; // จะเก็บเบอร์โทรที่เราค้นหาได้

    // const TaxiDriver = db.taxiDriver; // เรียกใช้ taxiDriver model
    // const StaffDriver = db.staffDriver; // เรียกใช้ taxiDriver model

    // console.log("Happy_Booking_ID", Happy_Booking_ID);
    // console.log("อัปเดตฟิลด์:", updateFields);

    // ตรวจสอบว่ามีฟิลด์ที่อนุญาตให้อัปเดต
    const allowedFields = [
      "PAID_go",
      "PAID_back",
      "CONFIRM_go",
      "CONFIRM_back",
    ];

    const updates = [];
    const values = [];

    for (const key of allowedFields) {
      if (key in updateFields) {
        updates.push(`${key} = ?`);
        values.push(updateFields[key]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "ไม่มีฟิลด์ให้ update" });
    }

    values.push(Happy_Booking_ID); // ใช้ใน WHERE

    const sql = `
      UPDATE HappyData
      SET ${updates.join(", ")}
      WHERE Booking_ID = ?
    `;

    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบ Booking_ID ที่ระบุ" });
    }

    //===============UPDATE ค่าจ้าง TAXI
    // console.log("updateFields ", updateFields);
    if (taxiId) {
      try {
        // 1️⃣ หา staffDriver ที่มี taxi_id ตรงกัน
        const staff = await TaxiDriver.findOne({ where: { taxi_id: taxiId } });
        phone = staff.phone;

        if (phone) {
          const staffDriver = await StaffDriver.findOne({ where: { phone } });

          let status_paid_taxi = 0;
          if (updateFields.PAID_back) status_paid_taxi = updateFields.PAID_back;
          if (updateFields.PAID_go) status_paid_taxi = updateFields.PAID_go;

          let price_send = 0;
          if (updateFields.data.RETURN_back === 1) {
            price_send = updateFields.data.PRICE / 2;
          } else {
            price_send = updateFields.data.PRICE;
          }

          const paymentData = {
            staffDriver_id: staffDriver.staffDriver_id,
            driver: staffDriver.driver,
            phone: staffDriver.phone,
            lineId: staffDriver.line_user_id,
            taxi_lpr: updateFields.data.taxi_lpr,
            Booking_ID: updateFields.data.Booking_ID,
            START: updateFields.data.START,
            DESTINATION: updateFields.data.DESTINATION,
            RETURN_back: updateFields.data.RETURN_back,
            price_send,
            trip_type: updateFields.data.trip_type,
            trip_date: updateFields.data.trip_date,
            status_paid_taxi,
          };

          // 🔍 ค้นหา record เดิมจาก 3 คีย์
          const existingPayment = await TaxiPayment.findOne({
            where: {
              phone: staffDriver.phone,
              Booking_ID: updateFields.data.Booking_ID,
              trip_type: updateFields.data.trip_type,
            },
          });

          // console.log("existingPayment ", existingPayment);
          console.log("paymentData ", paymentData);

          if (existingPayment) {
            // ✅ มีข้อมูล → update status_paid_taxi
            await existingPayment.update({ status_paid_taxi });
            console.log("🔁 อัปเดตสถานะการจ่ายเงินให้คนขับแล้ว");
          } else {
            // ❌ ไม่มีข้อมูล → สร้างใหม่
            await TaxiPayment.create(paymentData);
            console.log("✅ เพิ่มข้อมูลรายได้ของคนขับเรียบร้อย");
          }
        }
      } catch (err) {
        console.error(
          "❌ Error while looking up or updating TaxiPayment:",
          err
        );
      }
    }
    //===============

    return res.status(200).json({
      message: "อัปเดตสำเร็จ",
      updatedFields: updateFields,
    });
  } catch (error) {
    console.error("❌ Error updating status:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

//get taxi payment

// GET: /api/taxiPayments
exports.getAllTaxiPayments = async (req, res) => {
  try {
    const payments = await TaxiPayment.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error("❌ Error fetching taxi payments:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};

exports.getLineTaxiPayments = async (req, res) => {
  const lineUid = req.params.id;
  // console.log("lineUid ", lineUid);
  try {
    // 🔍 ดึงข้อมูล staffDriver จาก lineUid
    const payments = await db.taxiPayment.findAll({
      where: { lineId: lineUid },
    });

    if (!payments) {
      return res
        .status(404)
        .json({ message: "ไม่พบข้อมูลพนักงานจาก LINE UID นี้" });
    }

    // const phone = staffDriver.phone;

    // // 🔍 ดึง taxiPayment ที่ตรงกับเบอร์โทร
    // const payments = await db.taxiPayment.findAll({
    //   where: { phone },
    //   order: [["createdAt", "DESC"]],
    // });

    res.status(200).json(payments);
  } catch (error) {
    console.error("❌ Error fetching taxi payments:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};

exports.confirmTaxi = async (req, res) => {
  try {
    const { Happy_Booking_ID } = req.params;
    const updateFields = req.body;

    console.log("Happy_Booking_ID", Happy_Booking_ID);
    console.log("อัปเดตฟิลด์:", updateFields);

    // ตรวจสอบว่ามีฟิลด์ที่อนุญาตให้อัปเดต
    // const allowedFields = [
    //   "PAID_go",
    //   "PAID_back",
    //   "CONFIRM_go",
    //   "CONFIRM_back",
    // ];

    // const updates = [];
    // const values = [];

    // for (const key of allowedFields) {
    //   if (key in updateFields) {
    //     updates.push(`${key} = ?`);
    //     values.push(updateFields[key]);
    //   }
    // }

    // if (updates.length === 0) {
    //   return res.status(400).json({ message: "ไม่มีฟิลด์ให้ update" });
    // }

    // values.push(Happy_Booking_ID); // ใช้ใน WHERE

    // const sql = `
    //   UPDATE HappyData
    //   SET ${updates.join(", ")}
    //   WHERE Booking_ID = ?
    // `;

    // const [result] = await pool.query(sql, values);

    // if (result.affectedRows === 0) {
    //   return res.status(404).json({ message: "ไม่พบ Booking_ID ที่ระบุ" });
    // }

    // return res.status(200).json({
    //   message: "อัปเดตสำเร็จ",
    //   updatedFields: updateFields,
    // });

    res.send("OK");
  } catch (error) {
    console.error("❌ Error updating status:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

// lineToDriver taxi

exports.lineToDriver = async (req, res) => {
  try {
    const { Happy_Booking_ID } = req.params;

    // 1. ดึงข้อมูลจาก HappyData รวม START, DESTINATION
    const [rows] = await pool.query(
      "SELECT TAXI_lpr_go, TAXI_lpr_back, START, DESTINATION FROM HappyData WHERE Booking_ID = ?",
      [Happy_Booking_ID]
    );

    // console.log("rows ", rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูล Booking นี้" });
    }

    const Lpr_go = rows[0].TAXI_lpr_go;
    const Lpr_back = rows[0].TAXI_lpr_back;
    const target_start = rows[0].START;
    const target_destination = rows[0].DESTINATION;

    console.log("Lpr_go ", Lpr_go);
    console.log("Lpr_back ", Lpr_back);
    console.log("target_start ", target_start);
    console.log("target_destination ", target_destination);

    // 2. หาข้อมูล line_user_id ของคนขับ
    const driverGo = await TaxiDriver.findOne({
      where: { taxi_lpr: Lpr_go },
      attributes: ["line_user_id"],
    });

    if (driverGo) {
      console.log("driverGo ", driverGo.dataValues);
    } else {
      console.log("ไม่พบ driverGo");
    }

    const driverBack = await TaxiDriver.findOne({
      where: { taxi_lpr: Lpr_back },
      attributes: ["line_user_id"],
    });

    if (driverBack) {
      console.log("driverBack ", driverBack.dataValues);
    } else {
      console.log("ไม่พบ driverBack");
    }

    const get_line_user_id_go = driverGo?.dataValues?.line_user_id || null;
    const get_line_user_id_back = driverBack?.dataValues?.line_user_id || null;

    // 3. รวม userId ที่ไม่เป็น null
    const arr_send_line_taxi = [
      get_line_user_id_go,
      get_line_user_id_back,
    ].filter(Boolean);

    console.log("arr_send_line_taxi ", arr_send_line_taxi);

    if (arr_send_line_taxi.length === 0) {
      return res
        .status(400)
        .json({ message: "ไม่พบ line_user_id สำหรับคนขับ" });
    }

    // gen text to send
    const formatLineText = (bookingId, start, destination) => {
      const maxTotalLength = 60;

      const prefix = `Booking ID: ${bookingId}\nจาก: `;
      const middle = `\nไป: `;

      const remainingLength = maxTotalLength - prefix.length - middle.length;

      // แบ่งความยาวคงเหลือให้ start/destination คนละครึ่ง
      const maxEach = Math.floor(remainingLength / 2);

      const trimmedStart =
        start.length > maxEach ? start.slice(0, maxEach - 3) + "..." : start;

      const trimmedDestination =
        destination.length > maxEach
          ? destination.slice(0, maxEach - 3) + "..."
          : destination;

      const finalText = `${prefix}${trimmedStart}${middle}${trimmedDestination}`;

      // fallback: ถ้ายังเกิน (เช่น bookingId ยาวเกิน), ตัดท้ายสุด
      return finalText.length > maxTotalLength
        ? finalText.slice(0, maxTotalLength - 3) + "..."
        : finalText;
    };

    const createRichMessageSendGo = (bookingId, start, destination) => ({
      type: "template",
      altText: `งานจองใหม่ Booking ID: ${bookingId}`,
      template: {
        type: "buttons",
        title: "งานจองใหม่ ขาไป",
        // ข้อความต้องไม่เกิน 60 ตัวอักษร
        // text: `Booking ID: ${bookingId}\nจาก: ${start}\nไป: ${destination}`.slice(
        //   0,
        //   60
        // ),
        text: formatLineText(bookingId, start, destination),

        actions: [
          {
            type: "postback",
            label: "Confirm",
            data: `action=confirm&bookingId=${bookingId}&direction=go`,
            displayText: "ยืนยันงานแล้ว",
          },
          {
            type: "message",
            label: "ปฏิเสธ",
            text: `ปฏิเสธงาน ขาไป Booking ID: ${bookingId}`,
          },
          {
            type: "message",
            label: "ดูรายละเอียดทั้งหมด",
            text: `📋 Booking ID: ${bookingId}\nจาก: ${start}\nไป: ${destination}`,
          },
        ],
      },
    });

    const createRichMessageSendBack = (bookingId, start, destination) => ({
      type: "template",
      altText: `งานจองใหม่ Booking ID: ${bookingId}`,
      template: {
        type: "buttons",
        title: "งานจองใหม่ ขากลับ",
        // ข้อความต้องไม่เกิน 60 ตัวอักษร
        // text: `Booking ID: ${bookingId}\nจาก: ${destination}\nไป: ${start}`.slice(
        //   0,
        //   60
        // ),
        text: formatLineText(bookingId, destination, start),

        actions: [
          {
            type: "postback",
            label: "Confirm",
            data: `action=confirm&bookingId=${bookingId}&direction=back`,
            displayText: "ยืนยันงานแล้ว",
          },
          {
            type: "message",
            label: "ปฏิเสธ",
            text: `ปฏิเสธงาน ขากลับ Booking ID: ${bookingId}`,
          },
          {
            type: "message",
            label: "ดูรายละเอียดทั้งหมด",
            text: `📋 Booking ID: ${bookingId}\nจาก: ${destination}\nไป: ${start}`,
          },
        ],
      },
    });

    // 4. สร้างข้อความ rich message แบบ dynamic
    const createRichMessage = (bookingId, start, destination) => ({
      type: "template",
      altText: `งานจองใหม่ Booking ID: ${bookingId}`,
      template: {
        type: "buttons",
        title: "งานจองใหม่",
        // ข้อความต้องไม่เกิน 60 ตัวอักษร
        text: `Booking ID: ${bookingId}\nจาก: ${start}\nไป: ${destination}`.slice(
          0,
          60
        ),
        actions: [
          {
            type: "postback",
            label: "Confirm",
            data: `action=confirm&bookingId=${bookingId}`,
            displayText: "ยืนยันงานแล้ว",
          },
          {
            type: "message",
            label: "ปฏิเสธ",
            text: `ปฏิเสธงาน Booking ID: ${bookingId}`,
          },
        ],
      },
    });

    // 5. ส่งข้อความไปยังทุก userId
    // const notifyPromises = arr_send_line_taxi.map((userId) =>
    //   sendLineNotify(
    //     userId,
    //     createRichMessage(Happy_Booking_ID, target_start, target_destination)
    //   )
    // );

    // 5. ส่งข้อความเฉพาะที่ต้องการตามคนขับ go / back
    const notifyPromises = [];
    console.log("🧾 userId = ", get_line_user_id_go);
    // ถ้ามี line_user_id ของ driverGo → ส่ง createRichMessageSendGo
    if (get_line_user_id_go) {
      console.log("get_line_user_id_go");
      console.log("Happy_Booking_ID", Happy_Booking_ID);

      // const userId = "U0a5d99211cce04ecbdfd7b500f675b42"; // ตัวอย่าง LINE User ID
      // const messageText = "สวัสดีครับ นี่คือข้อความทดสอบจากระบบ";

      notifyPromises.push(
        sendLineNotify(
          get_line_user_id_go,
          createRichMessageSendGo(
            Happy_Booking_ID,
            target_start,
            target_destination
          )
        )
      );
    }

    // ถ้ามี line_user_id ของ driverBack → ส่ง createRichMessageSendBack
    if (get_line_user_id_back) {
      console.log("get_line_user_id_back");
      notifyPromises.push(
        sendLineNotify(
          get_line_user_id_back,
          createRichMessageSendBack(
            Happy_Booking_ID,
            target_start,
            target_destination
          )
        )
      );
    }
    await Promise.all(notifyPromises);

    return res.status(200).json({
      message: "ส่งแจ้งเตือนสำเร็จ",
      line_user_ids: arr_send_line_taxi,
    });
  } catch (error) {
    console.error("❌ Error sending line notification:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};
