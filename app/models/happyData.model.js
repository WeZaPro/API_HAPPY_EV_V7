// models/happyData.model.js

module.exports = (sequelize, DataTypes) => {
  const HappyData = sequelize.define(
    "HappyData",
    {
      ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      Booking_ID: {
        type: DataTypes.STRING(20),
        unique: true,
      },
      Booking_Date: {
        type: DataTypes.DATE,
      },
      Agent_Booking_Id: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      Customer_Name: {
        type: DataTypes.STRING(255),
      },
      Image_Url: {
        type: DataTypes.TEXT,
        defaultValue: "none",
      },
      AGENT_NAME: {
        type: DataTypes.STRING(100),
      },
      AGENT_STAFF_ID: {
        type: DataTypes.STRING(50),
        defaultValue: "none",
      },
      EMAIL: {
        type: DataTypes.STRING(100),
        defaultValue: "none",
      },
      PHONE: {
        type: DataTypes.STRING(50),
        defaultValue: "none",
      },
      START: {
        type: DataTypes.TEXT,
        defaultValue: "none",
      },
      DESTINATION: {
        type: DataTypes.TEXT,
        defaultValue: "none",
      },
      RETURN_back: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      PRICE: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      Date_go: {
        type: DataTypes.DATE,
      },
      TAXI_id_go: {
        type: DataTypes.STRING(100),
        defaultValue: "none",
      },
      TAXI_lpr_go: {
        type: DataTypes.STRING(100),
        defaultValue: "none",
      },
      Status_go: {
        type: DataTypes.STRING(100),
        defaultValue: "planning",
      },
      PAID_go: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      CONFIRM_go: {
        type: DataTypes.TEXT,
        defaultValue: "standby",
      },
      Date_back: {
        type: DataTypes.DATE,
      },
      TAXI_id_back: {
        type: DataTypes.STRING(100),
        defaultValue: "none",
      },
      TAXI_lpr_back: {
        type: DataTypes.STRING(100),
        defaultValue: "none",
      },
      Status_back: {
        type: DataTypes.STRING(100),
        defaultValue: "none",
      },
      PAID_back: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      CONFIRM_back: {
        type: DataTypes.TEXT,
        defaultValue: "standby",
      },
      Job_status: {
        type: DataTypes.STRING(50),
        defaultValue: "hold",
      },
    },
    {
      tableName: "HappyData", // ✅ ตั้งชื่อ table ให้ตรงกับ MySQL
      timestamps: false, // ✅ ปิดการใช้ createdAt / updatedAt
    }
  );

  return HappyData;
};
