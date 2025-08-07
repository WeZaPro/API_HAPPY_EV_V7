const pool = require("../config/config.booking");

// function extractFromBody(bodyText) {
//   const blocks = bodyText
//     .split("บริษัทแฮพเพนอินเมย์ จำกัด")
//     .map((b) => b.split("ADVANCE BOOKING")[0]?.trim())
//     .filter(Boolean);

//   const extract = (text, regex) => {
//     const match = text.match(regex);
//     return match ? match[1].trim() : "";
//   };

//   const results = blocks.map((block) => {
//     const Order = extract(block, /Order:\s*(.+)/);
//     const Employee = extract(block, /Employee:\s*(.+)/);
//     const POS = extract(block, /POS:\s*(.+)/);
//     const LPR = extract(
//       block,
//       /แคชเชียร์\s*([\u0E00-\u0E7Fa-zA-Z0-9\s]+?)\s*฿0\.00/
//     );
//     const rawDestination = extract(block, /1 × ฿0\.00\s+(.+)/);

//     let form = "";
//     let to = "";

//     if (rawDestination.includes("-")) {
//       const [part1, ...rest] = rawDestination.split("-");
//       form = part1.trim();
//       to = rest.join("-").trim();
//     }

//     const totalMatches = [...block.matchAll(/Total\s+฿([0-9,.]+)/g)];
//     const Total =
//       totalMatches.length > 0
//         ? `฿${totalMatches[totalMatches.length - 1][1]}`
//         : "";

//     return {
//       Order,
//       Employee,
//       POS,
//       LPR,
//       destination: rawDestination,
//       form,
//       to,
//       Total,
//     };
//   });

//   return results.filter((obj) => Object.values(obj).some((val) => val !== ""));
// }

exports.uploadEmailResults = async (req, res) => {
  // สมมติ client ส่งมาแบบ { data: [...] } คือ array ของ object
  const { data } = req.body;
  console.log("data --> ", data);

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
      "SELECT Booking_ID FROM HappyData"
    );
    const existingIds = new Set(existing.map((r) => r.Booking_ID?.trim()));

    const parsedResults = [];
    const duplicateBookings = [];

    for (const item of data) {
      const bookingId = item.Order?.trim();
      if (!bookingId) continue;

      if (!existingIds.has(bookingId)) {
        parsedResults.push(item);
      } else {
        duplicateBookings.push(bookingId);
      }
    }

    // for (const item of parsedResults) {
    // const bookingId = item.Order?.trim();
    for (let i = 0; i < parsedResults.length; i++) {
      const item = parsedResults[i];

      const orderId = item.Order?.trim(); // ใช้บันทึกใน email_results (field `order`)
      const bookingIdGen = `hap${String(Date.now() + i).slice(-6)}`; // ใช้บันทึกใน HappyData (Booking_ID)

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
            Date_back, TAXI_id_back, Status_back, Job_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
