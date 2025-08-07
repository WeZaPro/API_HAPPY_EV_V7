const db = require("../models"); // import Sequelize models
const User = db.user;
const Company = db.company;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // จาก middleware decode token
    const user = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: Company,
          as: "company",
          attributes: ["company_code", "company_name", "code_emp", "image_url"], // เพิ่ม image_url
        },
      ],
    });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    let companyData = user.company?.dataValues || {};
    if (companyData.code_emp && typeof companyData.code_emp === "string") {
      try {
        companyData.code_emp = JSON.parse(companyData.code_emp);
      } catch (e) {
        companyData.code_emp = []; // fallback
      }
    }

    const response = {
      id: user.id,
      username: user.username,
      email: user.email,
      company_code: user.company_code,
      status: user.status,
      company: companyData,
    };

    res.send(response);
  } catch (err) {
    console.error("Get user profile error", err);
    res.status(500).send({ message: err.message });
  }
};
