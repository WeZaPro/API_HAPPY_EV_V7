const fs = require("fs"); // ต้องเพิ่มบรรทัดนี้
const path = require("path");
const db = require("../models");
const WebContent = db.webcontent;

const BASE_URL = process.env.URL || "https://api.happyevtravelandtransfer.com";

// ✅ Create web content
exports.create = async (req, res) => {
  try {
    const { title, detailweb, typeContent, languageContent } = req.body;

    // ตรวจสอบว่าอัปโหลดไฟล์มาหรือไม่
    if (!req.file) {
      return res.status(400).send({ message: "No image file uploaded" });
    }

    // สร้าง URL สำหรับรูปภาพ เช่น "/webcontent/image-xxxxx.jpg"
    const imageUrl = `${BASE_URL}/webcontent/${req.file.filename}`;

    const newContent = await WebContent.create({
      title,
      detailweb,
      imageUrl,
      typeContent,
      languageContent,
    });

    res.status(201).send(newContent);
  } catch (err) {
    console.error("🔥 Error creating web content:", err);
    res.status(500).send({ message: err.message });
  }
};

// ✅ Get all web content
exports.findAll = async (req, res) => {
  try {
    const contents = await WebContent.findAll();
    console.log("📌 Found web contents:", contents);
    res.send(contents);
  } catch (err) {
    console.error("🔥 Error fetching web contents:", err);
    res.status(500).send({ message: err.message });
  }
};

// ✅ Get web content by ID
exports.findById = async (req, res) => {
  try {
    const id = req.params.id;
    const content = await WebContent.findByPk(id);

    if (!content) {
      return res.status(404).send({ message: "Web content not found" });
    }

    res.send(content);
  } catch (err) {
    console.error("🔥 Error fetching web content:", err);
    res.status(500).send({ message: err.message });
  }
};

// 🟢 UPDATE
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, detailweb, typeContent, languageContent, status } = req.body;

    const web = await WebContent.findByPk(id);
    if (!web) return res.status(404).send({ message: "Web content not found" });

    let imageUrl = web.imageUrl;

    // 🔁 ถ้ามีไฟล์ใหม่ให้ลบไฟล์เก่า
    if (req.file) {
      const oldImagePath = path.join(__dirname, "..", "..", imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      imageUrl = `${BASE_URL}/webcontent/` + req.file.filename;
    }

    // ✏️ อัปเดต
    await web.update({
      title,
      detailweb,
      imageUrl,
      typeContent,
      languageContent,
      status,
    });

    res.send(web);
  } catch (err) {
    console.error("🔥 Error updating web content:", err);
    res.status(500).send({ message: err.message });
  }
};

// 🔴 DELETE
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const content = await WebContent.findByPk(id);

    if (!content) {
      return res.status(404).send({ message: "Web content not found" });
    }

    console.log("imageUrl from DB:", content.imageUrl);

    const filename = path.basename(content.imageUrl);
    const filepath = path.join(__dirname, "..", "webcontent", filename);

    console.log("Deleting file at path:", filepath);

    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log("File deleted successfully");
      } else {
        console.log("File not found at path");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }

    await WebContent.destroy({ where: { id } });

    res.send({ message: "Web content and image file deleted successfully" });
  } catch (err) {
    console.error("🔥 Error deleting web content:", err);
    res.status(500).send({ message: err.message });
  }
};
// exports.delete = async (req, res) => {
//   try {
//     const id = req.params.id;

//     const web = await WebContent.findByPk(id);
//     if (!web) return res.status(404).send({ message: "Web content not found" });

//     // 🔁 ลบไฟล์รูปเก่าถ้ามี
//     const imagePath = path.join(__dirname, "..", "..", web.imageUrl);
//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//     }

//     await web.destroy();

//     res.send({ message: "Web content deleted successfully" });
//   } catch (err) {
//     console.error("🔥 Error deleting web content:", err);
//     res.status(500).send({ message: err.message });
//   }
// };
