// app/controllers/company.controller.js

const db = require("../models");

const Company = db.company;
const User = db.user;
// require("dotenv").config();

// Create new company
// Controller สำหรับ create company
// Create new company
exports.create = async (req, res) => {
  try {
    let { company_name, company_code, code_emp, roles } = req.body;

    // ✅ รองรับ roles เป็น string เช่น "moderator"
    if (typeof roles === "string") {
      roles = [roles];
    } else if (typeof roles === "undefined" || !Array.isArray(roles)) {
      roles = [];
    }

    // ✅ แปลง code_emp หากเป็น string
    let parsedCodeEmp = code_emp;
    if (typeof code_emp === "string") {
      try {
        parsedCodeEmp = JSON.parse(code_emp);
      } catch (e) {
        parsedCodeEmp = [];
      }
    }

    // ✅ ดัดแปลง company_code ตาม role
    if (roles.includes("moderator") && !company_code.startsWith("MOD-")) {
      company_code = "MOD-" + company_code;
    } else if (roles.includes("user") && !company_code.startsWith("HAP-")) {
      company_code = "HAP-" + company_code;
    }

    let image_url = null;
    if (req.file) {
      image_url = process.env.URL + "/profile/" + req.file.filename;
    }

    console.log("✅ Final company_code =", company_code);

    const newCompany = await Company.create({
      company_name,
      company_code,
      code_emp: parsedCodeEmp,
      image_url,
    });

    res.status(201).send(newCompany);
  } catch (err) {
    console.error("🔥 Sequelize error: ", err);
    res.status(500).send({ message: err.message, error: err.errors });
  }
};

// exports.create = async (req, res) => {
//   try {
//     const { company_name, company_code, code_emp } = req.body;

//     let parsedCodeEmp = code_emp;
//     if (typeof code_emp === "string") {
//       parsedCodeEmp = JSON.parse(code_emp);
//     }

//     let image_url = null;
//     if (req.file) {
//       image_url = process.env.URL + "/profile/" + req.file.filename;
//     }
//     console.log("image_url ", image_url);
//     const newCompany = await Company.create({
//       company_name,
//       company_code,
//       code_emp: parsedCodeEmp,
//       image_url,
//     });

//     res.status(201).send(newCompany);
//   } catch (err) {
//     console.error("🔥 Sequelize error: ", err);
//     res.status(500).send({ message: err.message, error: err.errors });
//   }
// };

// Retrieve all companies
exports.findAll = async (req, res) => {
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

// Update a company by id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Company.update(req.body, {
      where: { id: id },
    });
    if (updated) {
      const updatedCompany = await Company.findByPk(id);
      return res.send(updatedCompany);
    }
    res.status(404).send({ message: "Company not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete a company by id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Company.destroy({
      where: { id: id },
    });
    if (deleted) {
      return res.send({ message: "Company deleted successfully" });
    }
    res.status(404).send({ message: "Company not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Find a company by email

exports.findCompanyImageByUserEmail = async (req, res) => {
  try {
    const { email } = req.params;

    console.log("email ", email);

    // ขั้นตอนที่ 1: หา user จาก email
    const user = await User.findOne({ where: { email } });

    console.log("user ", user);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const companyCode = user.company_code;

    // ขั้นตอนที่ 2: หา company จาก company_code
    const company = await Company.findOne({
      where: { company_code: companyCode },
    });

    if (!company) {
      return res
        .status(404)
        .send({ message: "Company not found for this user" });
    }

    // ส่งเฉพาะ image_url หรือส่งข้อมูล company ทั้งหมด
    return res.send({
      image_url: company.image_url,
      company_name: company.company_name,
      company_code: company.company_code,
    });
  } catch (err) {
    console.error("🔥 Error in findCompanyImageByUserEmail:", err);
    res.status(500).send({ message: "Server error", error: err.message });
  }
};
