const pool = require("../config/config.booking");
const db = require("../models"); // โหลด Sequelize models ทั้งหมด
const TaxiDriver = db.taxiDriver; // เรียกใช้ taxiDriver model
const User = db.user;
const Company = db.company;
//===========Find
exports.getAllUser = async (req, res) => {
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

exports.getAllCompany = async (req, res) => {
  try {
    const companies = await Company.findAll();
    console.log("companies ", companies);

    // แปลง code_emp จาก JSON string เป็น object (array)
    const formattedCompanies = companies.map((company) => {
      return {
        ...company.dataValues,
        code_emp: JSON.parse(company.code_emp),
      };
    });

    res.send(formattedCompanies);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.getAllTaxiDriver = async (req, res) => {
  try {
    const drivers = await TaxiDriver.findAll();
    res.send(drivers);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

//===========Update
exports.updateCompany = async (req, res) => {
  try {
    const id = req.params.id;

    // ตรวจสอบว่ามีข้อมูลใน req.body หรือไม่
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .send({ message: "กรุณาส่งข้อมูลที่ต้องการอัปเดต" });
    }

    const [updated] = await Company.update(req.body, {
      where: { id: id },
    });

    if (updated === 1) {
      const updatedCompany = await Company.findByPk(id);
      return res.status(200).send(updatedCompany);
    } else {
      return res
        .status(404)
        .send({ message: `ไม่พบ company ที่มี id = ${id}` });
    }
  } catch (err) {
    console.error("❌ Error updating company:", err);
    res
      .status(500)
      .send({ message: err.message || "เกิดข้อผิดพลาดระหว่างอัปเดตข้อมูล" });
  }
};

exports.updateTaxiDriver = async (req, res) => {
  try {
    const id = req.params.id; // ใช้ id จาก URL เช่น /taxidriver/:id

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .send({ message: "กรุณาระบุข้อมูลที่ต้องการอัปเดต" });
    }

    const [updated] = await TaxiDriver.update(req.body, {
      where: { id: id },
    });

    if (updated === 1) {
      const updatedDriver = await TaxiDriver.findByPk(id);
      return res.status(200).send(updatedDriver);
    } else {
      return res
        .status(404)
        .send({ message: `ไม่พบ taxi driver ที่มี id = ${id}` });
    }
  } catch (err) {
    console.error("❌ Error updating taxi driver:", err);
    res
      .status(500)
      .send({ message: err.message || "เกิดข้อผิดพลาดระหว่างอัปเดต" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .send({ message: "กรุณาระบุข้อมูลที่ต้องการอัปเดต" });
    }

    // ไม่ควรให้แก้รหัสผ่านตรงนี้แบบ plain text (เว้นแต่คุณจะเข้ารหัสแยกต่างหาก)
    if (req.body.password) {
      return res
        .status(400)
        .send({ message: "ไม่สามารถอัปเดตรหัสผ่านจาก endpoint นี้ได้" });
    }

    const [updated] = await User.update(req.body, {
      where: { id: id },
    });

    if (updated === 1) {
      const updatedUser = await User.findByPk(id);
      return res.status(200).send(updatedUser);
    } else {
      return res.status(404).send({ message: `ไม่พบผู้ใช้ที่มี id = ${id}` });
    }
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res
      .status(500)
      .send({ message: err.message || "เกิดข้อผิดพลาดระหว่างอัปเดต" });
  }
};

//===========get by id
exports.getCompanyById = async (req, res) => {
  try {
    const id = req.params.id;
    const company = await Company.findByPk(id);

    if (!company) {
      return res
        .status(404)
        .send({ message: `ไม่พบ company ที่มี id = ${id}` });
    }

    // ✅ ตรวจสอบและแปลง code_emp จาก string เป็น array (ถ้าจำเป็น)
    if (typeof company.code_emp === "string") {
      try {
        company.code_emp = JSON.parse(company.code_emp);
      } catch (parseErr) {
        console.warn("⚠️ ไม่สามารถแปลง code_emp เป็น JSON:", parseErr);
      }
    }

    res.status(200).json(company);
  } catch (err) {
    console.error("❌ Error fetching company:", err);
    res.status(500).send({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท" });
  }
};

exports.getTaxiDriverById = async (req, res) => {
  try {
    const id = req.params.id;
    const taxiDriver = await TaxiDriver.findByPk(id);

    if (!taxiDriver) {
      return res
        .status(404)
        .send({ message: `ไม่พบ taxi driver ที่มี id = ${id}` });
    }

    res.status(200).json(taxiDriver);
  } catch (err) {
    console.error("❌ Error fetching taxi driver:", err);
    res
      .status(500)
      .send({ message: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).send({ message: `ไม่พบผู้ใช้ที่มี id = ${id}` });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res
      .status(500)
      .send({ message: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" });
  }
};
