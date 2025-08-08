const db = require("../models");
const HappyData = db.happyData; // ต้องตรงกับชื่อที่ export ใน model
const TaxiPaymentData = db.taxiPayment; // ต้องตรงกับชื่อที่ export ใน model
// const sequelize = db.sequelize;
const { Op, fn, col, literal } = require("sequelize");
const moment = require("moment");

exports.getReportAgentLineChart = async (req, res) => {
  try {
    // const { startDate, endDate } = req.body;
    // console.log("startDate ", startDate);
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    // กำหนดช่วงเวลาปลอดภัย
    const safeStart = startDate
      ? startDate + " 00:00:00"
      : "2025-08-07 00:00:00";
    const safeEnd = endDate ? endDate + " 23:59:59" : "2025-08-09 23:59:59"; // รวมถึง 9 ส.ค.

    // const safeStart = startDate;
    // const safeEnd = endDate;
    // สร้าง array labels ของวันที่ จาก start ถึง end (inclusive)
    const labels = [];
    let currentDate = moment(safeStart);
    const endMoment = moment(safeEnd);

    while (currentDate.isSameOrBefore(endMoment, "day")) {
      labels.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    // Query ดึงข้อมูล Group by วันที่ และ AGENT_NAME รวมราคา
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
      group: [literal("DATE(Booking_Date)"), "AGENT_NAME"],
      order: [[literal("DATE(Booking_Date)"), "ASC"]],
      raw: true, // ได้ object ง่ายขึ้น
    });

    // ดึง agent ทั้งหมดจาก rawData
    const agents = [...new Set(rawData.map((r) => r.AGENT_NAME))];

    // สร้าง datasets เริ่มต้นเป็น 0 ทุกวัน ทุก agent
    const datasets = agents.map((agent, idx) => ({
      label: agent,
      data: labels.map(() => 0),
      borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`, // สีตัวอย่าง (เปลี่ยนได้)
      backgroundColor: `hsla(${(idx * 60) % 360}, 70%, 50%, 0.3)`,
      tension: 0.3,
    }));

    // map rawData เข้า datasets ให้ตรง label และวัน
    rawData.forEach(({ date, AGENT_NAME, total_price }) => {
      const dataset = datasets.find((d) => d.label === AGENT_NAME);
      if (dataset) {
        const index = labels.indexOf(moment(date).format("YYYY-MM-DD"));
        if (index !== -1) {
          dataset.data[index] = Number(total_price);
        }
      }
    });

    res.json({ labels, datasets });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
};

exports.getReportAgentDoughnutChart = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    const safeStart = startDate
      ? startDate + " 00:00:00"
      : "2025-08-01 00:00:00";
    const safeEnd = endDate ? endDate + " 23:59:59" : "2025-08-07 23:59:59";

    const rawData = await HappyData.findAll({
      attributes: ["AGENT_NAME", [fn("SUM", col("PRICE")), "total_price"]],
      where: {
        Booking_Date: {
          [Op.between]: [safeStart, safeEnd],
        },
      },
      group: ["AGENT_NAME"],
      order: [[fn("SUM", col("PRICE")), "DESC"]],
      raw: true,
    });

    // สร้าง labels และ data
    const labels = rawData.map((r) => r.AGENT_NAME);
    const data = rawData.map((r) => Number(r.total_price));

    // สร้างสีแบบสุ่มหรือกำหนดไว้
    const backgroundColors = [
      "red",
      "green",
      "blue",
      "orange",
      "purple",
      "gray",
      "yellow",
      "pink",
    ].slice(0, labels.length); // ตัดให้เท่ากับจำนวน labels

    const datasets = [
      {
        label: "Doughnut",
        data,
        backgroundColor: backgroundColors,
      },
    ];

    res.json({ labels, datasets });
  } catch (error) {
    console.error("Error generating doughnut chart:", error);
    res.status(500).json({ message: "Failed to generate doughnut chart" });
  }
};

exports.getReportTaxiPaymentLineChart = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    const safeStart = startDate
      ? startDate + " 00:00:00"
      : "2025-08-07 00:00:00";
    const safeEnd = endDate ? endDate + " 23:59:59" : "2025-08-09 23:59:59";

    // สร้าง labels สำหรับทุกวันที่อยู่ในช่วงเวลา
    const labels = [];
    let currentDate = moment(safeStart);
    const endMoment = moment(safeEnd);

    while (currentDate.isSameOrBefore(endMoment, "day")) {
      labels.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    // ดึงข้อมูลจาก trip table (เช่น HappyData แต่ชื่อจริงของ model อาจต่างออกไป)
    const rawData = await TaxiPaymentData.findAll({
      attributes: [
        [fn("DATE", col("trip_date")), "date"],
        "taxi_lpr",
        [fn("SUM", col("price_send")), "total_price"],
      ],
      where: {
        trip_date: {
          [Op.between]: [safeStart, safeEnd],
        },
      },
      group: [literal("DATE(trip_date)"), "taxi_lpr"],
      order: [[literal("DATE(trip_date)"), "ASC"]],
      raw: true,
    });

    // หาทะเบียนรถทั้งหมด
    const taxiList = [...new Set(rawData.map((r) => r.taxi_lpr))];

    // สร้าง datasets สำหรับแต่ละทะเบียน
    const datasets = taxiList.map((taxi, idx) => ({
      label: taxi,
      data: labels.map(() => 0),
      borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
      backgroundColor: `hsla(${(idx * 60) % 360}, 70%, 50%, 0.3)`,
      tension: 0.3,
    }));

    // ใส่ข้อมูลเข้า datasets
    rawData.forEach(({ date, taxi_lpr, total_price }) => {
      const dataset = datasets.find((d) => d.label === taxi_lpr);
      if (dataset) {
        const index = labels.indexOf(moment(date).format("YYYY-MM-DD"));
        if (index !== -1) {
          dataset.data[index] = Number(total_price);
        }
      }
    });

    res.json({ labels, datasets });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
};

exports.getReportTaxiPaymentDoughnutChart = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    const safeStart = startDate
      ? startDate + " 00:00:00"
      : "2025-08-07 00:00:00";
    const safeEnd = endDate ? endDate + " 23:59:59" : "2025-08-09 23:59:59";

    // ดึงข้อมูล trip group by taxi_lpr (ไม่ต้องแยกวัน)
    const rawData = await TaxiPaymentData.findAll({
      attributes: ["taxi_lpr", [fn("SUM", col("price_send")), "total_price"]],
      where: {
        trip_date: {
          [Op.between]: [safeStart, safeEnd],
        },
      },
      group: ["taxi_lpr"],
      raw: true,
    });

    // รวมยอดของแต่ละ taxi_lpr
    const doughnutLabels = rawData.map((r) => r.taxi_lpr);
    const doughnutData = rawData.map((r) => Number(r.total_price));
    const doughnutColors = doughnutLabels.map(
      (_, idx) => `hsl(${(idx * 60) % 360}, 70%, 50%)`
    );

    const doughnut = {
      labels: doughnutLabels,
      datasets: [
        {
          label: "Doughnut",
          data: doughnutData,
          backgroundColor: doughnutColors,
        },
      ],
    };

    res.json(doughnut);
  } catch (error) {
    console.error("Error generating doughnut chart:", error);
    res.status(500).json({ message: "Failed to generate doughnut chart" });
  }
};

// exports.getReportTaxiPaymentLineAndDoughnutChart = async (req, res) => {
//   try {
//     const startDate = req.body.startDate;
//     const endDate = req.body.endDate;

//     const safeStart = startDate
//       ? startDate + " 00:00:00"
//       : "2025-08-07 00:00:00";
//     const safeEnd = endDate ? endDate + " 23:59:59" : "2025-08-09 23:59:59";

//     // Line chart labels (รายวัน)
//     const labels = [];
//     let currentDate = moment(safeStart);
//     const endMoment = moment(safeEnd);

//     while (currentDate.isSameOrBefore(endMoment, "day")) {
//       labels.push(currentDate.format("YYYY-MM-DD"));
//       currentDate = currentDate.add(1, "day");
//     }

//     // ดึงข้อมูล trip group by trip_date และ taxi_lpr
//     const rawData = await TaxiPaymentData.findAll({
//       attributes: [
//         [fn("DATE", col("trip_date")), "date"],
//         "taxi_lpr",
//         [fn("SUM", col("price_send")), "total_price"],
//       ],
//       where: {
//         trip_date: {
//           [Op.between]: [safeStart, safeEnd],
//         },
//       },
//       group: [literal("DATE(trip_date)"), "taxi_lpr"],
//       order: [[literal("DATE(trip_date)"), "ASC"]],
//       raw: true,
//     });

//     // ----------------------
//     // 📊 Line Chart Datasets
//     // ----------------------
//     const taxiList = [...new Set(rawData.map((r) => r.taxi_lpr))];

//     const datasets = taxiList.map((taxi, idx) => ({
//       label: taxi,
//       data: labels.map(() => 0),
//       borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
//       backgroundColor: `hsla(${(idx * 60) % 360}, 70%, 50%, 0.3)`,
//       tension: 0.3,
//     }));

//     rawData.forEach(({ date, taxi_lpr, total_price }) => {
//       const dataset = datasets.find((d) => d.label === taxi_lpr);
//       if (dataset) {
//         const index = labels.indexOf(moment(date).format("YYYY-MM-DD"));
//         if (index !== -1) {
//           dataset.data[index] = Number(total_price);
//         }
//       }
//     });

//     // -------------------------
//     // 🍩 Doughnut Chart Dataset
//     // -------------------------
//     const totalPerTaxi = {}; // รวมยอดของแต่ละ taxi_lpr

//     rawData.forEach(({ taxi_lpr, total_price }) => {
//       if (!totalPerTaxi[taxi_lpr]) {
//         totalPerTaxi[taxi_lpr] = 0;
//       }
//       totalPerTaxi[taxi_lpr] += Number(total_price);
//     });

//     const doughnutLabels = Object.keys(totalPerTaxi);
//     const doughnutData = Object.values(totalPerTaxi);
//     const doughnutColors = doughnutLabels.map(
//       (_, idx) => `hsl(${(idx * 60) % 360}, 70%, 50%)`
//     );

//     const doughnut = {
//       labels: doughnutLabels,
//       datasets: [
//         {
//           label: "Doughnut",
//           data: doughnutData,
//           backgroundColor: doughnutColors,
//         },
//       ],
//     };

//     // -----------------------
//     // 📦 ส่งออกทั้ง 2 chart
//     // -----------------------
//     console.log("line ");
//     res.json({
//       line: {
//         labels,
//         datasets,
//       },
//       doughnut,
//     });
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res.status(500).json({ message: "Failed to generate report" });
//   }
// };

exports.findAllAgent = async (req, res) => {
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

exports.findAllTaxi = async (req, res) => {
  console.log("------<");
  try {
    const allTaxiPaymentData = await TaxiPaymentData.findAll();
    console.log(
      "📌 Found allTaxiPaymentData records:",
      allTaxiPaymentData.length
    );
    res.send(allTaxiPaymentData);
  } catch (err) {
    console.error("🔥 Error fetching allTaxiPaymentData:", err);
    res.status(500).send({ message: err.message });
  }
};
