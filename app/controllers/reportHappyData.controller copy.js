const db = require("../models");
const HappyData = db.happyData; // ต้องตรงกับชื่อที่ export ใน model
// const sequelize = db.sequelize;
const { Op, fn, col, literal } = require("sequelize");
const moment = require("moment");

exports.getReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const safeStart = startDate
      ? startDate + " 00:00:00"
      : "2025-08-01 00:00:00";
    const safeEnd = endDate ? endDate + " 23:59:59" : "2025-08-07 23:59:59";

    console.log("📅 Querying between:", safeStart, "->", safeEnd);

    const rawData = await HappyData.findAll({
      attributes: [
        [fn("DATE", col("Booking_Date")), "date"],
        "AGENT_NAME",
        [fn("SUM", col("PRICE")), "total_price"],
      ],
      where: {
        Booking_Date: {
          [Op.between]: [safeStart, safeEnd],
        },
      },
      group: ["AGENT_NAME", fn("DATE", col("Booking_Date"))],
      order: [[fn("DATE", col("Booking_Date")), "ASC"]],
      raw: true,
    });

    // 1. สร้าง labels (list วันที่) ตามช่วง
    const labels = [];
    let current = moment(safeStart);
    const last = moment(safeEnd);
    while (current.isSameOrBefore(last, "day")) {
      labels.push(current.format("YYYY-MM-DD"));
      current = current.add(1, "day");
    }

    // 2. หาชื่อ agent ทั้งหมด
    const agents = [...new Set(rawData.map((item) => item.AGENT_NAME))];

    // 3. สร้าง dataset สำหรับแต่ละ agent โดยมีค่า price ต่อวัน
    const datasets = agents.map((agent, i) => {
      // กำหนดสีสวยๆ หรือสุ่มสีได้เอง
      const colors = [
        "rgba(78, 52, 122, 1)",
        "rgba(84, 145, 228, 1)",
        "rgba(178, 36, 221, 1)",
        "rgba(255, 99, 132, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 206, 86, 1)",
      ];
      const bgColors = colors.map((c) => c.replace("1)", "0.3)"));

      // map ข้อมูลวันที่-ราคา ของ agent นี้
      const priceMap = rawData
        .filter((x) => x.AGENT_NAME === agent)
        .reduce((acc, cur) => {
          acc[cur.date] = Number(cur.total_price);
          return acc;
        }, {});

      // เตรียม data โดยใส่ 0 หากไม่มีข้อมูลวันนั้น
      const data = labels.map((date) => priceMap[date] || 0);

      return {
        label: agent,
        data,
        borderColor: colors[i % colors.length],
        backgroundColor: bgColors[i % colors.length],
        tension: 0.3,
      };
    });

    res.json({ labels, datasets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// exports.getReportDataLineChart = async (req, res) => {
//   try {
//     // ดึงข้อมูลระหว่างวันที่ (หากส่งช่วงวันมาทาง query)
//     const { startDate, endDate } = req.query;

//     const safeStart = startDate
//       ? startDate + " 00:00:00"
//       : "2025-08-01 00:00:00";
//     const safeEnd = endDate ? endDate + " 23:59:59" : "2025-08-07 23:59:59";

//     console.log("📅 Querying between:", safeStart, "->", safeEnd);

//     // ดึงข้อมูลทั้งหมดในช่วงเวลาที่กำหนด
//     const rawData = await HappyData.findAll({
//       attributes: [
//         [fn("DATE", col("Booking_Date")), "date"],
//         "AGENT_NAME",
//         [fn("SUM", col("PRICE")), "total_price"],
//       ],
//       where: {
//         Booking_Date: {
//           [Op.between]: [safeStart, safeEnd],
//         },
//       },
//       group: ["AGENT_NAME", fn("DATE", col("Booking_Date"))],
//       order: [[fn("DATE", col("Booking_Date")), "ASC"]],
//     });

//     console.log("rawData ", rawData);

//     // 🔧 เตรียม labels ทุกวันระหว่าง start ถึง end
//     const moment = require("moment");
//     const allDates = [];
//     let current = moment(startDate || "2025-08-01");
//     const end = moment(endDate || "2025-08-07");

//     while (current.isSameOrBefore(end)) {
//       allDates.push(current.format("YYYY-MM-DD"));
//       current = current.add(1, "days");
//     }

//     // 🔁 กลุ่มข้อมูลตาม AGENT_NAME
//     const groupedData = {};

//     rawData.forEach((record) => {
//       const date = record.getDataValue("date");
//       const agent = record.getDataValue("AGENT_NAME");
//       const price = parseFloat(record.getDataValue("total_price"));

//       console.log("record ", record);

//       if (!groupedData[agent]) {
//         groupedData[agent] = {};
//       }

//       groupedData[agent][date] = price;
//     });

//     // 🔁 สร้าง datasets ให้ตรง format Chart.js
//     const datasets = Object.keys(groupedData).map((agent) => {
//       const data = allDates.map((date) => groupedData[agent][date] || 0);

//       return {
//         label: agent,
//         data,
//         borderColor: randomColor(1),
//         backgroundColor: randomColor(0.3),
//         tension: 0.3,
//       };
//     });

//     console.log("dataSet ", datasets);

//     // ✅ ส่งออกในรูปแบบที่พร้อมใช้ในกราฟ
//     res.json({
//       labels: allDates,
//       datasets,
//     });
//   } catch (error) {
//     console.error("🔥 Error generating report:", error);
//     res.status(500).json({ message: "Error generating report", error });
//   }
// };

// 🎨 ฟังก์ชันสร้างสีสุ่ม
function randomColor(opacity = 1) {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

exports.findAll = async (req, res) => {
  console.log("------<");
  try {
    const allBookings = await HappyData.findAll();
    console.log("📌 Found HappyData records:", allBookings.length);
    res.send(allBookings);
  } catch (err) {
    console.error("🔥 Error fetching HappyData:", err);
    res.status(500).send({ message: err.message });
  }
};
