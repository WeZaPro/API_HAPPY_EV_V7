require("dotenv").config();
const pool = require("../config/config.booking");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../models"); // import models ทั้งหมด
const Order = db.order; // ดึง model order ออกมาใช้
const endpointSecret = process.env.ENDPOINT_SECRET;

// const endpointSecret =
//   "whsec_0f5b7e08ed3c0d94fe3a644fcf94739c8278eb8675116c959c29053ec0debfcc";

// Handle Stripe Webhook

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    // console.log("Webhook event verified:", event.type);
    // console.log("Webhook event.data.object:=======>", event.data.object);
    // console.log("Webhook eq.body------>", req.body);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await Order.update(
          {
            status: "completed",
            customer_name: session.customer_details?.name || null,
            customer_email: session.customer_details?.email || null,
            stripe_payment_intent_id: session.payment_intent || null,
          },
          { where: { stripe_session_id: session.id } }
        );

        // ตัวอย่างเรียกฟังก์ชันเพิ่มเติมหลังชำระเงินสำเร็จ
        await processPaymentSuccess({
          sessionId: session.id,
          status: "completed",
          customerName: session.customer_details?.name,
          customerEmail: session.customer_details?.email,
          paymentIntentId: session.payment_intent,
        });

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await Order.update(
          { status: "succeeded" },
          { where: { stripe_payment_intent_id: paymentIntent.id } }
        );

        // ตัวอย่างเรียกฟังก์ชันเพิ่มเติมหลังชำระเงินสำเร็จ
        await processPaymentSuccess({
          sessionId: session.id,
          paymentIntentId: paymentIntent.id,
          status: "succeeded",
          amountReceived: paymentIntent.amount_received,
          currency: paymentIntent.currency,
          customerId: paymentIntent.customer,
        });
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        await Order.update(
          {
            status: "async_payment_failed",
            customer_name: session.customer_details?.name || null,
            customer_email: session.customer_details?.email || null,
          },
          { where: { stripe_session_id: session.id } }
        );
        console.log(`Async payment failed for session ${session.id}`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        await Order.update(
          { status: "expired" },
          { where: { stripe_session_id: session.id } }
        );
        console.log(`Checkout session expired: ${session.id}`);
        break;
      }

      // ... other cases

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // ตอบกลับ Stripe ว่า webhook รับข้อมูลเรียบร้อย
    return res.status(200).send({ received: true });
  } catch (error) {
    console.error("Error handling webhook event:", error);
    res.status(500).send(`Webhook handler error: ${error.message}`);
  }
};

// ฟังก์ชันตัวอย่างสำหรับทำ process ต่อหลัง payment success
async function processPaymentSuccess(data) {
  //   console.log("Process payment success data:", data);

  try {
    // หา Order ที่ตรงกับ stripe_session_id
    const order = await Order.findOne({
      where: { stripe_session_id: data.sessionId },
    });

    if (!order) {
      console.warn(`Order with stripe_session_id=${data.sessionId} not found.`);
      return;
    }

    // ถ้าพบ order จะทำงานต่อ เช่น อัพเดตสถานะเพิ่มเติม หรือส่งเมล
    // console.log("Found order id:", order.order_id);
    // console.log("Found order:", order.dataValues);
    await saveDataBookingFromWeb(order.dataValues);
    // ตัวอย่างอัปเดตสถานะ (ถ้าต้องการ)
    // await order.update({ status: data.status });

    // ตัวอย่างเรียกฟังก์ชันส่งเมล (ต้องเขียนฟังก์ชันนี้เอง)
    // await sendReceiptEmail(data.customerEmail, order);

    // ตัวอย่าง process อื่น ๆ ที่ต้องการ
  } catch (error) {
    console.error("Error in processPaymentSuccess:", error);
  }
}

async function saveDataBookingFromWeb(data) {
  let connection;
  try {
    connection = await pool.getConnection();

    // 🧠 Generate ID
    const pickup = data.PickUpPoint; //
    const dropoff = data.DropOffPoint; //
    const AGENT_STAFF_ID = data.order_id;
    const EMAIL = data.Email; //
    const PHONE = data.MobileNumber; //
    const guest = data.FirstName + " " + data.LastName;
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const bookingId = `hap${String(Date.now()).slice(-6)}`;
    const agentBookingId = data.order_id;

    // ✅ แปลงค่าที่รับมา
    const returnBack =
      data.Returnning === true || data.Returnning === 1 ? 1 : 0;
    const price = parseFloat(data.Price) || 0;
    const dateGo = data.PickUpDate ? new Date(data.PickUpDate) : null;
    const dateBack = data.ReturnDate ? new Date(data.ReturnDate) : null;

    // 📝 Insert HappyData
    await connection.query(
      `
            INSERT INTO HappyData (
              Booking_ID, Booking_Date, Agent_Booking_Id, Customer_Name, Image_Url,
              AGENT_NAME, AGENT_STAFF_ID, EMAIL, PHONE, START, DESTINATION,
              RETURN_back, PRICE, Date_go, TAXI_id_go, Status_go, Date_back,
              TAXI_id_back, Status_back, Job_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
      [
        bookingId,
        today,
        agentBookingId,
        guest,
        "none",
        "HappyEv-WEB", //setCodeCompany, //companyName,//AGENT_NAME
        AGENT_STAFF_ID || "none",
        EMAIL || "none",
        PHONE || "none",
        pickup,
        dropoff,
        returnBack,
        price,
        dateGo,
        "none",
        "planning",
        dateBack,
        "none",
        "none",
        "hold",
      ]
    );

    // console.log(
    //   `Booking created: Booking_ID=${bookingId}, Agent_Booking_Id=${agentBookingId}`
    // );

    // ถ้าต้องการคืนค่า ก็คืน bookingId หรือข้อมูลอื่น ๆ
    return { bookingId, agentBookingId };
  } catch (err) {
    console.error("❌ Error creating booking:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด", detail: err.message });
  } finally {
    if (connection) connection.release();
  }
}
