// controllers/taxiTransaction.controller.js

const db = require("../models");
const TaxiTransaction = db.taxiTransaction;

// Create
exports.create = async (req, res) => {
  try {
    const {
      Happy_Booking_ID,
      taxi_id,
      taxi_lpr,
      start,
      destination,
      return_way,
      date_go,
      date_back,
      price,
      paid,
      confirm,
      status_go,
      status_back,
    } = req.body;

    console.log("Happy_Booking_ID >>", Happy_Booking_ID);

    // 🔧 เตรียมข้อมูลสร้างใหม่
    const newTransaction = await TaxiTransaction.create({
      Happy_Booking_ID,
      taxi_id,
      taxi_lpr,
      start,
      destination,
      return_way,
      date_go,
      date_back,
      status_go,
      status_back,
      price,
      paid, // ← ใช้ค่าจาก client
      confirm,
    });

    res.status(201).send(newTransaction);
  } catch (err) {
    console.error("🔥 Error creating transaction:", err);
    res.status(500).send({ message: err.message });
  }
};

// Read all
exports.findAll = async (req, res) => {
  try {
    const all = await TaxiTransaction.findAll();
    res.send(all);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// controllers/taxiTransaction.controller.js

exports.update = async (req, res) => {
  try {
    const { taxi_id } = req.body;

    if (!taxi_id) {
      return res
        .status(400)
        .send({ message: "Missing taxi_id in request body." });
    }

    const [updated] = await TaxiTransaction.update(req.body, {
      where: { taxi_id: taxi_id },
    });

    if (updated) {
      const updatedTransaction = await TaxiTransaction.findOne({
        where: { taxi_id: taxi_id },
      });

      return res.send(updatedTransaction);
    }

    res.status(404).send({ message: "Transaction not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete by id
// controllers/taxiTransaction.controller.js

exports.delete = async (req, res) => {
  try {
    const { taxi_id } = req.body;

    if (!taxi_id) {
      return res
        .status(400)
        .send({ message: "Missing taxi_id in request body." });
    }

    const deleted = await TaxiTransaction.destroy({
      where: { taxi_id: taxi_id },
    });

    if (deleted) {
      return res.send({
        message: `Transaction(s) with taxi_id ${taxi_id} deleted successfully.`,
      });
    }

    res.status(404).send({ message: "Transaction not found." });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
