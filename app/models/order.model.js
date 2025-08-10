// models/order.model.js
module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define(
    "order",
    {
      order_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true, // Primary Key
      },
      booking_id: {
        type: Sequelize.STRING,
        allowNull: true, // อนุญาตให้ NULL
      },
      PickUpPoint: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      DropOffPoint: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      PickUpDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ReturnDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      Returnning: {
        type: Sequelize.BOOLEAN, // ใช้ boolean
        allowNull: false,
        defaultValue: false, // ค่าเริ่มต้น false
      },
      Price: {
        type: Sequelize.DECIMAL(10, 2), // รูปแบบ currency
        allowNull: false,
        defaultValue: 0.0, // ค่าเริ่มต้น 0.00
      },
      FirstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      LastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      MobileNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Country: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stripe_session_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "pending",
      },
      stripe_payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      charge_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      charge_status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      failure_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true, // Sequelize จะสร้าง createdAt และ updatedAt ให้อัตโนมัติ
      tableName: "orders",
      indexes: [
        {
          name: "idx_order_id",
          fields: ["order_id"],
        },
      ],
    }
  );

  return Order;
};
