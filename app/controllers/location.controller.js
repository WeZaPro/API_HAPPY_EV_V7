const db = require("../models");
const Location = db.location;
const RoutePair = db.route_pair; // ✅ เพิ่มบรรทัดนี้
const sequelize = db.sequelize;

// Create loation + จับคู่ OK
exports.create = async (req, res) => {
  try {
    const { address, status } = req.body;

    // ✅ สร้าง location ใหม่
    const newLocation = await Location.create({
      address,
      status: status ?? true,
    });

    // ✅ ดึง location ทั้งหมด
    const locations = await Location.findAll();

    // ✅ สร้าง route_pairs เมื่อมีมากกว่า 1 location
    if (locations.length > 1) {
      const newPairs = [];

      for (const loc of locations) {
        if (loc.id === newLocation.id) continue;

        // ✅ ตรวจสอบว่า route นี้มีอยู่หรือยัง (ทั้ง A-B และ B-A)
        const existing = await RoutePair.findOne({
          where: {
            [db.Sequelize.Op.or]: [
              { A: newLocation.address, B: loc.address },
              { A: loc.address, B: newLocation.address },
            ],
          },
        });

        if (!existing) {
          newPairs.push({
            A: newLocation.address,
            B: loc.address,
            price: 0,
          });
        }
      }

      // ✅ สร้างทั้งหมดในครั้งเดียว
      if (newPairs.length > 0) {
        await RoutePair.bulkCreate(newPairs);
      }
    }

    res.status(201).send(newLocation);
  } catch (err) {
    console.error("🔥 Error creating location:", err);
    res.status(500).send({ message: err.message });
  }
};

// ใน controllers/location.controller.js
exports.findAll = async (req, res) => {
  try {
    const locations = await Location.findAll();
    console.log("📌 Found locations:", locations);
    res.send(locations);
  } catch (err) {
    console.error("🔥 Error fetching locations:", err);
    res.status(500).send({ message: err.message });
  }
};

exports.findUseMenu = async (req, res) => {
  try {
    const locations = await Location.findAll({
      where: {
        status: true, // กรองเฉพาะ status = true
      },
    });
    console.log("📌 Found locations (status = true):", locations);
    res.send(locations);
  } catch (err) {
    console.error("🔥 Error fetching locations:", err);
    res.status(500).send({ message: err.message });
  }
};

// ✅ Get location by ID
exports.findById = async (req, res) => {
  try {
    const id = req.params.id;
    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).send({ message: "Location not found" });
    }

    res.send(location);
  } catch (err) {
    console.error("🔥 Error fetching location:", err);
    res.status(500).send({ message: err.message });
  }
};

// ✅ Update location by ID
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Location.update(req.body, {
      where: { id },
    });

    if (updated) {
      const updatedLocation = await Location.findByPk(id);
      return res.send(updatedLocation);
    }

    res.status(404).send({ message: "Location not found" });
  } catch (err) {
    console.error("🔥 Error updating location:", err);
    res.status(500).send({ message: err.message });
  }
};

// table จับคู่ ===================================>
//table จับคู่
exports.findPrice = async (req, res) => {
  const { Start, End } = req.body;

  if (!Start || !End) {
    return res.status(400).json({ error: "กรุณาระบุ Start และ End" });
  }

  try {
    const [rows] = await sequelize.query(
      `SELECT price, A, B FROM route_pairs 
       WHERE (A = ? AND B = ?) OR (A = ? AND B = ?) 
       LIMIT 1`,
      {
        replacements: [Start, End, End, Start],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!rows) {
      return res.status(404).json({ error: "ไม่พบเส้นทางนี้" });
    }

    res.json({
      price: rows.price,
      Start: rows.A,
      End: rows.B,
      // route: {
      //   Start: rows.A,
      //   End: rows.B,
      // },
    });
  } catch (error) {
    console.error("🔥 Error querying route_pairs:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการค้นหาข้อมูล" });
  }
};

exports.findPriceAll = async (req, res) => {
  try {
    const routes = await RoutePair.findAll({
      order: [
        ["A", "ASC"],
        ["B", "ASC"],
      ],
      attributes: ["id", "A", "B", "price"],
    });

    if (!routes || routes.length === 0) {
      return res.status(404).json({ error: "ยังไม่มีข้อมูลเส้นทาง" });
    }

    const results = routes.map((r) => ({
      id: r.id,
      price: r.price,
      Start: r.A,
      End: r.B,
      // route: {
      //   Start: r.A,
      //   End: r.B,
      // },
    }));

    res.json({ routes: results });
  } catch (error) {
    console.error("🔥 Error fetching all route_pairs:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};

exports.updatePrice = async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (price === undefined || isNaN(price)) {
    return res.status(400).json({ error: "กรุณาระบุราคาที่ถูกต้อง" });
  }

  try {
    const [updated] = await RoutePair.update(
      { price: price },
      { where: { id: id } }
    );

    if (updated === 0) {
      return res
        .status(404)
        .json({ error: "ไม่พบ route_pair ที่ต้องการอัปเดต" });
    }

    res.json({ message: `อัปเดตราคาสำหรับ route_pair id=${id} เรียบร้อยแล้ว` });
  } catch (error) {
    console.error("🔥 Error updating price:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตราคา" });
  }
};

exports.deleteRoutePair = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await RoutePair.destroy({ where: { id: id } });

    if (deleted === 0) {
      return res.status(404).json({ error: "ไม่พบ route_pair ที่ต้องการลบ" });
    }

    res.json({ message: `ลบ route_pair id=${id} เรียบร้อยแล้ว` });
  } catch (error) {
    console.error("🔥 Error deleting route_pair:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
};
