// controllers/taxiTransaction.controller.js

const db = require("../models");
const TaxiTransaction = db.taxiTransaction;
const TaxiDriver = db.taxiDriver;

// GET /api/taxiTransaction/withDriver
exports.findAllWithDriver = async (req, res) => {
  try {
    const transactions = await TaxiTransaction.findAll({
      include: [
        {
          model: TaxiDriver,
          attributes: [
            "taxi_id",
            "taxi_lpr",
            "driver",
            "line_name",
            "line_user_id",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.send(transactions);
  } catch (err) {
    console.error("🔥 Error fetching joined data:", err);
    res.status(500).send({ message: err.message });
  }
};

//update paid status

exports.updatePaidStatus = async (req, res) => {
  console.log("req ", req);
  try {
    const { Happy_Booking_ID } = req.params;
    const { paid_status } = req.body;

    console.log("Happy_Booking_ID ", Happy_Booking_ID);
    console.log("paid_status ", paid_status);

    if (typeof paid_status !== "boolean") {
      return res.status(400).json({ message: "paid_status ต้องเป็น boolean" });
    }

    const transaction = await TaxiTransaction.findOne({
      where: { Happy_Booking_ID },
    });
    console.log("transaction ", transaction);

    if (!transaction) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่ระบุ" });
    }

    transaction.paid_status = paid_status;
    await transaction.save();

    return res.status(200).json({
      message: "อัปเดตสถานะการจ่ายเงินสำเร็จ",
      data: transaction,
    });
  } catch (error) {
    console.error("Error updating paid_status:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
};
// update confirm from line Taxi driver
// exports.deleteTransaction = async (req, res) => {
//   console.log("req ", req);
//   try {
//     const { Happy_Booking_ID } = req.params;
//     console.log("Happy_Booking_ID ", Happy_Booking_ID);
//     // ค้นหาข้อมูลก่อนว่ามีจริงหรือไม่
//     const transaction = await TaxiTransaction.findOne({
//       where: { Happy_Booking_ID },
//     });

//     if (!transaction) {
//       return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });
//     }

//     // ลบข้อมูล
//     await TaxiTransaction.destroy({
//       where: { Happy_Booking_ID },
//     });

//     return res.status(200).json({
//       message: "ลบข้อมูลเรียบร้อยแล้ว",
//       deletedID: Happy_Booking_ID,
//     });
//   } catch (error) {
//     console.error("Error deleting transaction:", error);
//     return res.status(500).json({
//       message: "เกิดข้อผิดพลาดในการลบข้อมูล",
//     });
//   }
// };

exports.deleteTransaction = async (req, res) => {
  try {
    const { Happy_Booking_ID } = req.params;
    const { taxi_lpr } = req.body; // ต้องส่งมาจาก frontend ด้วย

    if (!Happy_Booking_ID || !taxi_lpr) {
      return res
        .status(400)
        .json({ message: "ต้องส่ง Happy_Booking_ID และ taxi_lpr" });
    }

    // ค้นหา record
    const transaction = await TaxiTransaction.findOne({
      where: {
        Happy_Booking_ID,
        taxi_lpr,
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });
    }

    // ลบ record
    await TaxiTransaction.destroy({
      where: {
        Happy_Booking_ID,
        taxi_lpr,
      },
    });

    return res.status(200).json({
      message: "ลบข้อมูลเรียบร้อยแล้ว",
      deletedID: Happy_Booking_ID,
      deletedTaxiLpr: taxi_lpr,
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการลบข้อมูล",
    });
  }
};

// exports.updateConfirmQue = async (req, res) => {};
