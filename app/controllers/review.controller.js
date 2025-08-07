const db = require("../models");
const Review = db.review;

// ✅ Create a new review
exports.create = async (req, res) => {
  try {
    const { customer, review, rating } = req.body;

    if (!customer || !review) {
      return res
        .status(400)
        .send({ message: "Customer and review are required." });
    }

    const newReview = await Review.create({
      customer,
      review,
      rating: rating ?? 5,
      //   status: status ?? true,
    });

    res.status(201).send(newReview);
  } catch (err) {
    console.error("🔥 Error creating review:", err);
    res.status(500).send({ message: err.message });
  }
};

// ✅ Get all reviews
exports.findAll = async (req, res) => {
  try {
    const reviews = await Review.findAll();
    res.send(reviews);
  } catch (err) {
    console.error("🔥 Error fetching reviews:", err);
    res.status(500).send({ message: err.message });
  }
};

exports.findById = async (req, res) => {
  try {
    const id = req.params.id; // รับ id จาก URL parameter
    const review = await Review.findByPk(id); // หารีวิวตาม primary key

    if (!review) {
      return res.status(404).send({ message: "Review not found" });
    }

    res.send(review);
  } catch (err) {
    console.error("🔥 Error fetching review:", err);
    res.status(500).send({ message: err.message });
  }
};

exports.findAllUse = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: {
        status: true, // หรือ 1 ก็ได้
      },
    });
    res.send(reviews);
  } catch (err) {
    console.error("🔥 Error fetching reviews:", err);
    res.status(500).send({ message: err.message });
  }
};

// ✅ Update review by ID
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await Review.update(req.body, {
      where: { id },
    });

    if (updated) {
      const updatedReview = await Review.findByPk(id);
      return res.send(updatedReview);
    }

    res.status(404).send({ message: "Review not found" });
  } catch (err) {
    console.error("🔥 Error updating review:", err);
    res.status(500).send({ message: err.message });
  }
};

// ✅ Delete review by ID
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await Review.destroy({
      where: { id },
    });

    if (deleted) {
      return res.send({ message: "Review deleted successfully" });
    }

    res.status(404).send({ message: "Review not found" });
  } catch (err) {
    console.error("🔥 Error deleting review:", err);
    res.status(500).send({ message: err.message });
  }
};
