require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../models"); // ปรับ path ให้ถูกต้องตามโปรเจกต์คุณ
const Order = db.order; // หรือ db.Order ขึ้นกับการ export ใน models/index.js

exports.createCheckoutSession = async (req, res) => {
  try {
    const {
      PickUpPoint,
      DropOffPoint,
      PickUpDate,
      ReturnDate,
      Returnning,
      Price,
      FirstName,
      LastName,
      Email,
      MobileNumber,
      Gender,
      Country,
      quantity,
    } = req.body;

    // ตรวจสอบฟิลด์ที่จำเป็น
    if (
      !PickUpPoint ||
      !DropOffPoint ||
      !PickUpDate ||
      !Price ||
      !FirstName ||
      !LastName ||
      !Email ||
      !MobileNumber
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const unitAmountSatang = Math.round(parseFloat(Price) * 100);
    const orderId = uuidv4();

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: { name: `${PickUpPoint} → ${DropOffPoint}` },
            unit_amount: unitAmountSatang,
          },
          quantity: quantity || 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_REDIRECT_PAYMENT}/success.html?order_id=${orderId}`,
      // success_url: `${process.env.FRONTEND_REDIRECT_PAYMENT}/payment-success.html?order_id=${orderId}`,
      cancel_url: `${process.env.FRONTEND_REDIRECT_PAYMENT}/cancel.html?order_id=${orderId}`,
    });

    // console.log("session ", session);
    await Order.create({
      order_id: orderId,
      booking_id: null,
      PickUpPoint,
      DropOffPoint,
      PickUpDate,
      ReturnDate: ReturnDate || null,
      Returnning: Returnning ?? false,
      Price,
      FirstName,
      LastName,
      Email,
      MobileNumber,
      Gender: Gender || null,
      Country: Country || null,
      stripe_session_id: session.id,
      status: "pending",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("🔥 Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { order_id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "System error" });
  }
};
