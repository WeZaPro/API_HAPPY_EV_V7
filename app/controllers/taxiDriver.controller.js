// controllers/taxiDriver.controller.js

const db = require("../models");
const TaxiDriver = db.taxiDriver;
const StaffDriver = db.staffDriver;
const axios = require("axios");
// require("dotenv").config();
const pool = require("../config/config.booking");

// Create new driver
// exports.create_byAdmin = async (req, res) => {
//   try {
//     const taxi_id = `Ta-${String(Date.now()).slice(-6)}`;

//     const { taxi_lpr, driver, line_name, line_user_id } = req.body;
//     console.log("TaxiDriver Model: ", TaxiDriver);
//     const newDriver = await TaxiDriver.create({
//       taxi_id,
//       taxi_lpr,
//       driver,
//       line_name,
//       line_user_id,
//     });

//     res.status(201).send(newDriver);
//   } catch (err) {
//     console.error("🔥 Sequelize error: ", err);
//     res.status(500).send({ message: err.message, error: err.errors });
//   }
// };

exports.create_byAdmin = async (req, res) => {
  try {
    const taxi_id = `Ta-${String(Date.now()).slice(-6)}`;

    const { taxi_lpr } = req.body;
    console.log("TaxiDriver Model: ", TaxiDriver);
    const newDriver = await TaxiDriver.create({
      taxi_id,
      taxi_lpr,
      driver: null,
      line_name: null,
      line_user_id: null,
      staffDriver_id: null,
    });

    res.status(201).send(newDriver);
  } catch (err) {
    console.error("🔥 Sequelize error: ", err);
    res.status(500).send({ message: err.message, error: err.errors });
  }
};

// Get all drivers

exports.assignStaffToTaxiDriver = async (req, res) => {
  try {
    const { phone, taxi_id } = req.body;

    if (!phone || !taxi_id) {
      return res.status(400).send({ message: "กรุณาระบุ phone และ taxi_id" });
    }

    // 🔍 หา staffDriver จากเบอร์โทร
    const staff = await StaffDriver.findOne({ where: { phone } });

    if (!staff) {
      return res
        .status(404)
        .send({ message: "ไม่พบพนักงานขับรถจากเบอร์ที่ระบุ" });
    }

    // 🔍 เช็ค phone ซ้ำใน TaxiDriver (ยกเว้น taxi_id นี้)
    const existingDriver = await TaxiDriver.findOne({
      where: {
        phone,
        taxi_id: { [db.Sequelize.Op.ne]: taxi_id }, // ไม่เอา taxi_id ที่กำลังอัปเดต
      },
    });

    if (existingDriver) {
      return res.status(409).send({
        message: `เบอร์โทรนี้ถูกใช้โดย Taxi ID: ${existingDriver.taxi_id} อยู่แล้ว`,
      });
    }

    // ✅ อัปเดต taxiDriver ด้วยข้อมูลจาก staffDriver
    const [updatedCount] = await TaxiDriver.update(
      {
        link_staff_id: staff.staffDriver_id,
        driver: staff.driver,
        phone: staff.phone,
        line_name: staff.line_name,
        line_user_id: staff.line_user_id,
      },
      {
        where: { taxi_id },
      }
    );

    if (updatedCount === 0) {
      return res.status(404).send({ message: "ไม่พบ taxiDriver ที่ระบุ" });
    }

    return res
      .status(200)
      .send({ message: "อัปเดตข้อมูลคนขับสำเร็จ", staff_linked: staff });
  } catch (error) {
    console.error("❌ Error assigning staff to taxiDriver:", error);
    res.status(500).send({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const drivers = await TaxiDriver.findAll();
    res.send(drivers);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findByLineUserId = async (req, res) => {
  const { lineId } = req.params;

  try {
    const drivers = await TaxiDriver.findAll({
      where: { line_user_id: lineId }, // ชื่อฟิลด์ในตารางต้องเป็น lineId
    });

    if (drivers.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูล" });
    }

    res.json(drivers);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};
// Update driver by id

exports.update = async (req, res) => {
  try {
    const { taxi_id } = req.body;

    if (!taxi_id) {
      return res
        .status(400)
        .send({ message: "Missing taxi_id in request body." });
    }

    const [updated] = await TaxiDriver.update(req.body, {
      where: { taxi_id: taxi_id },
    });

    if (updated) {
      const updatedDriver = await TaxiDriver.findOne({
        where: { taxi_id: taxi_id },
      });
      return res.send(updatedDriver);
    }

    res.status(404).send({ message: "Driver not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { taxi_id } = req.body;

    if (!taxi_id) {
      return res
        .status(400)
        .send({ message: "Missing taxi_id in request body." });
    }

    const deleted = await TaxiDriver.destroy({
      where: { taxi_id: taxi_id },
    });

    if (deleted) {
      return res.send({
        message: `Driver with taxi_id ${taxi_id} deleted successfully.`,
      });
    }

    res.status(404).send({ message: "Driver not found." });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// line
// ฟังก์ชันใหม่: ดึงข้อมูลโปรไฟล์ LINE จาก user ID
// รับ webhook จาก LINE Messaging API

exports.handleLineWebhook = async (req, res) => {
  try {
    const events = req.body.events || [];

    console.log("📨 events", events);

    for (const event of events) {
      const line_user_id = event.source.userId;

      // กรณี event เป็น postback
      if (event.type === "postback") {
        const postbackData = event.postback?.data || "";
        const params = new URLSearchParams(postbackData);

        if (postbackData.includes("action=confirm")) {
          const bookingIdMatch = postbackData.match(/bookingId=([^&]+)/);
          const bookingId = bookingIdMatch ? bookingIdMatch[1] : "ไม่ทราบ";

          const params = new URLSearchParams(postbackData);
          const action = params.get("action");
          const direction = params.get("direction"); // <--- เพิ่มบรรทัดนี้

          console.log(
            `✅ ผู้ใช้ ${line_user_id} ยืนยันงาน Booking ID: ${bookingId}`
          );

          try {
            // ดึงข้อมูล LPR
            const driver = await TaxiDriver.findOne({
              where: { line_user_id },
            });

            if (!driver) {
              console.log("❌ ไม่พบ line_user_id นี้ใน table taxiDriver");
              return;
            }

            const taxi_lpr = driver.taxi_lpr; // หรือ driver.plate_number แล้วแต่ชื่อจริงใน DB
            console.log("🚕 พบเลขทะเบียน taxi_lpr =", taxi_lpr);

            // เอา bookingId และ taxi_lpr find rows ใน HappyData
            const connection = await pool.getConnection();
            const [rows] = await connection.execute(
              `
              SELECT * FROM HappyData 
              WHERE Booking_ID = ? 
              AND (TAXI_lpr_go = ? OR TAXI_lpr_back = ?)
              `,
              [bookingId, taxi_lpr, taxi_lpr]
            );

            if (rows.length === 0) {
              console.log("❌ ไม่พบข้อมูลใน HappyData");
            } else {
              const row = rows[0];
              let confirmField = null;
              //todo ====hold start
              // console.log("CHECK DIRECTION ", direction);
              //Todo ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              if (direction === "go") {
                await connection.execute(
                  `UPDATE HappyData SET CONFIRM_go = ? WHERE Booking_ID = ?`,
                  ["ok", bookingId]
                );
                // updated = true;
              } else {
                await connection.execute(
                  `UPDATE HappyData SET CONFIRM_back = ? WHERE Booking_ID = ?`,
                  ["ok", bookingId]
                );
                // updated = true;
              }
            }

            // todo -- end
            // ตอบกลับข้อความขอบคุณ
            await axios.post(
              "https://api.line.me/v2/bot/message/reply",
              {
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: `ขอบคุณที่ยืนยันงาน Booking ID: ${bookingId} ค่ะ`,
                  },
                ],
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                  "Content-Type": "application/json",
                },
              }
            );
          } catch (error) {
            console.error(
              "❌ เกิดข้อผิดพลาดระหว่างอัปเดต CONFIRM:",
              error.message
            );
          }

          continue; // เสร็จแล้วข้ามไป
        }

        if (postbackData.includes("action=reject")) {
          const bookingIdMatch = postbackData.match(/bookingId=([^&]+)/);
          const bookingId = bookingIdMatch ? bookingIdMatch[1] : "ไม่ทราบ";

          console.log(
            `❌ ผู้ใช้ ${line_user_id} ปฏิเสธงาน Booking ID==>: ${bookingId}`
          );

          try {
            // ตอบกลับข้อความรับทราบ
            await axios.post(
              "https://api.line.me/v2/bot/message/reply",
              {
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: `รับทราบการปฏิเสธงาน Booking ID: ${bookingId} ค่ะ`,
                  },
                ],
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                  "Content-Type": "application/json",
                },
              }
            );
          } catch (error) {
            console.error(
              "❌ เกิดข้อผิดพลาดระหว่างอัปเดต CONFIRM:",
              error.message
            );
          }

          continue;
        }
      }

      // กรณี event เป็นข้อความ (message)
      if (event.type === "message" && event.message.type === "text") {
        const userText = (event.message.text || "").toLowerCase();

        //todo test start
        if (userText === "wee") {
          await axios.post(
            "https://api.line.me/v2/bot/message/reply",
            {
              replyToken: event.replyToken,
              messages: [{ type: "text", text: "สวัสดี wee" }],
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );
          continue;
        }
        //todo test end

        if (userText.includes("ยืนยันงานแล้ว")) {
          console.log(
            `✅ ผู้ใช้ ${line_user_id} ส่งข้อความ====: ยืนยันงานแล้ว`
          );

          await axios.post(
            "https://api.line.me/v2/bot/message/reply",
            {
              replyToken: event.replyToken,
              messages: [{ type: "text", text: "ขอบคุณที่ยืนยันงานค่ะ" }],
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          continue;
        }

        if (userText.includes("ปฏิเสธงาน")) {
          // TODO: อัปเดตสถานะปฏิเสธใน DB
          // confirm = "cancle"

          try {
            //Todo ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

            const userText = event.message.text || "";
            let check_eject = "";
            // console.log("ปฏิเสธงาน userText ", userText);
            if (userText.includes("ขาไป")) {
              console.log("ปฏิเสธงาน ขาไป ++++++++++++> userText ", userText);
              check_eject = "go";
            } else {
              console.log("ปฏิเสธงาน ขากลับ ++++++++++++> userText ", userText);
              check_eject = "back";
            }

            console.log("check_eject ", check_eject);

            // ใช้ RegExp หา bookingId จากข้อความ
            const bookingIdMatch = userText.match(
              /Booking ID:\s*([a-zA-Z0-9]+)/
            );

            const booking_Id = bookingIdMatch ? bookingIdMatch[1] : null;

            if (booking_Id) {
              console.log("📦 ดึง booking_Id ได้:", booking_Id);
            } else {
              console.log("⚠️ ไม่พบ booking_Id ในข้อความนี้");
            }

            //===================

            // ดึงข้อมูล LPR
            const driver = await TaxiDriver.findOne({
              where: { line_user_id },
            });

            if (!driver) {
              console.log("❌ ไม่พบ line_user_id นี้ใน table taxiDriver");
              return;
            }

            const taxi_lpr = driver.taxi_lpr; // หรือ driver.plate_number แล้วแต่ชื่อจริงใน DB
            console.log("🚕 พบเลขทะเบียน taxi_lpr =", taxi_lpr);

            // เอา bookingId และ taxi_lpr find rows ใน HappyData
            const connection = await pool.getConnection();
            const [rows] = await connection.execute(
              `
              SELECT * FROM HappyData 
              WHERE Booking_ID = ? 
              AND (TAXI_lpr_go = ? OR TAXI_lpr_back = ?)
              `,
              [booking_Id, taxi_lpr, taxi_lpr]
            );

            console.log("rows -------> ", rows);
            console.log("taxi_lpr -------> ", taxi_lpr);
            console.log("rows taxi_lpr go-------> ", rows[0].TAXI_lpr_go);
            console.log("rows CONFIRM_go-------> ", rows[0].CONFIRM_go);
            console.log("rows taxi_lpr back-------> ", rows[0].TAXI_lpr_back);
            console.log("rows CONFIRM_back-------> ", rows[0].CONFIRM_back);

            if (rows.length === 0) {
              console.log("❌ ไม่พบข้อมูลใน HappyData");
            } else {
              const row = rows[0];

              let updated = false;
              // console.log("row.TAXI_lpr_go----> ", row.TAXI_lpr_go);
              // console.log("row.CONFIRM_go----> ", row.CONFIRM_go);
              //todo hold ---start
              // if (row.TAXI_lpr_go === taxi_lpr) {
              //   console.log(`🔄 อัปเดตฟิลด์ CONFIRM_go เป็น "cancle"`);

              //   await connection.execute(
              //     `UPDATE HappyData SET CONFIRM_go = ? WHERE Booking_ID = ?`,
              //     ["cancle", booking_Id]
              //   );

              //   updated = true;
              // }

              // if (row.TAXI_lpr_back === taxi_lpr) {
              //   console.log(`🔄 อัปเดตฟิลด์ CONFIRM_back เป็น "cancle"`);

              //   await connection.execute(
              //     `UPDATE HappyData SET CONFIRM_back = ? WHERE Booking_ID = ?`,
              //     ["cancle", booking_Id]
              //   );

              //   updated = true;
              // }

              //todo hold ---end

              //todo test

              if (check_eject === "go") {
                await connection.execute(
                  `UPDATE HappyData SET CONFIRM_go = ? WHERE Booking_ID = ?`,
                  ["cancle", booking_Id]
                );
                updated = true;
              } else {
                await connection.execute(
                  `UPDATE HappyData SET CONFIRM_back = ? WHERE Booking_ID = ?`,
                  ["cancle", booking_Id]
                );
                updated = true;
              }

              //todo test end

              if (!updated) {
                console.log(
                  "⚠️ ไม่พบว่ามีฟิลด์ใดที่ควรอัปเดต หรือถูกอัปเดตไปแล้ว"
                );
              } else {
                console.log("✅ อัปเดตเรียบร้อย");
              }
            }

            // TODO: อัปเดตสถานะปฏิเสธใน DB --END
            await axios.post(
              "https://api.line.me/v2/bot/message/reply",
              {
                replyToken: event.replyToken,
                messages: [{ type: "text", text: "รับทราบการปฏิเสธงานค่ะ" }],
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                  "Content-Type": "application/json",
                },
              }
            );
          } catch (error) {
            console.error(
              "❌ เกิดข้อผิดพลาดระหว่างอัปเดต CONFIRM:",
              error.message
            );
          }

          continue;
        }
      }

      // กรณีอื่น ๆ ไม่ต้องตอบกลับอะไร
      console.log(`ℹ️ ไม่ได้ตอบกลับ event type: ${event.type}`);
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    return res.status(500).send({ message: "Webhook processing failed." });
  }
};
