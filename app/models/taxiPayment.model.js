// models/taxiPayment.model.js

module.exports = (sequelize, Sequelize) => {
  const TaxiPayment = sequelize.define(
    "taxiPayment",
    {
      staffDriver_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      driver: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lineId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      taxi_lpr: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Booking_ID: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      START: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      DESTINATION: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      RETURN_back: {
        type: Sequelize.BOOLEAN,
        defaultValue: null,
      },
      price_send: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      trip_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      trip_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status_paid_taxi: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "TaxiPayment", // กำหนดชื่อตารางแบบกำหนดเอง
      timestamps: true, // เพื่อให้มี createdAt และ updatedAt อัตโนมัติ
    }
  );

  return TaxiPayment;
};
