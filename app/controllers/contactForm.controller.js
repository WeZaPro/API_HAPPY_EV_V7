// controllers/contactForm.controller.js
const db = require("../models");
const ContactForm = db.contactForm;

exports.submit = async (req, res) => {
  try {
    const { email, issue, bookingRef, description } = req.body;
    let attachment = null;

    if (req.file) {
      attachment = process.env.URL + "/form-attachments/" + req.file.filename;
    }

    const form = await ContactForm.create({
      email,
      issue,
      bookingRef,
      description,
      attachment,
    });

    res.status(201).send({
      message: "✅ Form submitted successfully",
      data: form,
    });
  } catch (err) {
    console.error("🔥 Error submitting form:", err);
    res.status(500).send({ message: err.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await ContactForm.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "✅ Successfully retrieved contact form data",
      data: contacts,
    });
  } catch (error) {
    console.error("🔥 Error fetching contacts:", error);
    res.status(500).json({
      message: "🔥 Failed to retrieve contacts",
      error: error.message,
    });
  }
};
