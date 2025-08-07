const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Company = db.company;
const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup_original = async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    const roles = req.body.roles;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .send({ message: "Username or Email already in use." });
    }

    const newUser = await User.create({
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      status: false,
    });

    if (roles && roles.length > 0) {
      const foundRoles = await Role.findAll({
        where: { name: { [Op.or]: roles } },
      });
      await newUser.setRoles(foundRoles);
    } else {
      const defaultRole = await Role.findOne({ where: { name: "user" } });
      await newUser.setRoles([defaultRole]);
    }

    res.status(201).send({
      message: "User registered successfully. Waiting for approval.",
      user: {
        username: newUser.username,
        email: newUser.email,
        status: newUser.status,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res
      .status(500)
      .send({ message: err.message || "An error occurred during signup." });
  }
};

exports.signup = async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    const roles = req.body.roles;
    const company_code = req.body.company_code?.trim();

    console.log("req.body.company_code -->", company_code);

    if (!company_code || company_code === "") {
      return res.status(400).send({ message: "company_code is required." });
    }

    const company = await Company.findOne({ where: { company_code } });

    if (!company) {
      return res.status(400).send({ message: "Invalid company code." });
    }

    let codeEmpArray = [];
    try {
      codeEmpArray = JSON.parse(company.code_emp);
    } catch {
      codeEmpArray = [];
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .send({ message: "Username or Email already in use." });
    }

    const newUser = await User.create({
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      company_code,
      status: false,
    });

    if (roles && roles.length > 0) {
      const foundRoles = await Role.findAll({
        where: {
          name: {
            [Op.or]: roles,
          },
        },
      });
      await newUser.setRoles(foundRoles);
    } else {
      const defaultRole = await Role.findOne({ where: { name: "user" } });
      await newUser.setRoles([defaultRole]);
    }

    res.status(201).send({
      message: "User registered successfully. Waiting for approval.",
      user: {
        username: newUser.username,
        email: newUser.email,
        company_code: newUser.company_code,
        status: newUser.status,
      },
      company: {
        company_name: company.company_name,
        company_code: company.company_code,
        code_emp: codeEmpArray,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res
      .status(500)
      .send({ message: err.message || "An error occurred during signup." });
  }
};

exports.signin = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    if (!user.status) {
      return res.status(403).send({ message: "Your account is inactive." });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid Password!" });
    }

    const roles = await user.getRoles();
    const authorities = roles
      .filter((role) => typeof role.name === "string")
      .map((role) => "ROLE_" + role.name.toUpperCase());

    // ✅ ดึง company_code จาก user โดยตรง
    const company_code = user.company_code || null;

    // ✅ ฝัง company_code เข้าใน token
    const token = jwt.sign(
      {
        id: user.id,
        roles: authorities,
        company_code: company_code,
      },
      config.secret,
      {
        expiresIn: 604800, // 7 วัน
      }
    );

    req.session.token = token;

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      token: token,
      company_code: company_code, // แนบมาใน response เช่นเดิม
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).send({ message: err.message });
  }
};

// ✅ ปรับ signin: เพิ่มการค้นหา company และแนบ company_code
// exports.signin = async (req, res) => {
//   try {
//     const email = req.body.email?.trim();
//     const password = req.body.password?.trim();

//     const user = await User.findOne({ where: { email } });

//     if (!user) {
//       return res.status(404).send({ message: "User Not found." });
//     }

//     if (!user.status) {
//       return res.status(403).send({ message: "Your account is inactive." });
//     }

//     const passwordIsValid = bcrypt.compareSync(password, user.password);
//     if (!passwordIsValid) {
//       return res.status(401).send({ message: "Invalid Password!" });
//     }

//     const roles = await user.getRoles();
//     const authorities = roles
//       .filter((role) => typeof role.name === "string")
//       .map((role) => "ROLE_" + role.name.toUpperCase());

//     // ✅ หาบริษัทที่มี email นี้อยู่ใน code_emp
//     const companies = await Company.findAll();
//     let company_code = "none";

//     for (const company of companies) {
//       try {
//         const empList = JSON.parse(company.code_emp || "[]");
//         if (Array.isArray(empList) && empList.includes(email)) {
//           company_code = company.company_code;
//           break;
//         }
//       } catch (e) {
//         console.error("Error parsing code_emp JSON:", e);
//       }
//     }

//     const token = jwt.sign(
//       {
//         id: user.id,
//         roles: authorities,
//         company_code: company_code, // เพิ่มตรงนี้
//       },
//       config.secret,
//       {
//         expiresIn: 604800, // 7 วัน
//       }
//     );

//     req.session.token = token;

//     res.status(200).send({
//       id: user.id,
//       username: user.username,
//       email: user.email,
//       roles: authorities,
//       token: token,
//       company_code: company_code, // ✅ แนบเพิ่มใน response
//     });
//   } catch (err) {
//     console.error("Signin error:", err);
//     res.status(500).send({ message: err.message });
//   }
// };

// exports.signin = async (req, res) => {
//   try {
//     const email = req.body.email?.trim();
//     const password = req.body.password?.trim();

//     const user = await User.findOne({ where: { email } });

//     if (!user) {
//       return res.status(404).send({ message: "User Not found." });
//     }

//     if (!user.status) {
//       return res.status(403).send({ message: "Your account is inactive." });
//     }

//     const passwordIsValid = bcrypt.compareSync(password, user.password);
//     if (!passwordIsValid) {
//       return res.status(401).send({ message: "Invalid Password!" });
//     }

//     const roles = await user.getRoles();

//     console.log("Roles from getRoles():", roles);
//     roles.forEach((role, i) => {
//       console.log(`role[${i}] id=${role.id}, name=${role.name}`);
//     });

//     const authorities = roles
//       .filter((role) => typeof role.name === "string")
//       .map((role) => "ROLE_" + role.name.toUpperCase());

//     const token = jwt.sign(
//       {
//         id: user.id,
//         roles: authorities,
//       },
//       config.secret,
//       {
//         expiresIn: 604800, // 7 วัน
//       }
//     );

//     req.session.token = token;

//     res.status(200).send({
//       id: user.id,
//       username: user.username,
//       email: user.email,
//       roles: authorities,
//       token: token,
//     });
//   } catch (err) {
//     console.error("Signin error:", err);
//     res.status(500).send({ message: err.message });
//   }
// };

exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({ message: "You've been signed out!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
