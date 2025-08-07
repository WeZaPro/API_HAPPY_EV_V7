// models/staffDriver.model.js

module.exports = (sequelize, Sequelize) => {
  const StaffDriver = sequelize.define(
    "staffDriver",
    {
      staffDriver_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      driver: {
        type: Sequelize.STRING,
      },
      phone: {
        type: Sequelize.STRING,
      },
      line_name: {
        type: Sequelize.STRING,
      },
      line_user_id: {
        type: Sequelize.STRING,
      },
    },
    {
      tableName: "staffDriver", // บังคับชื่อตาราง
      timestamps: true, // เปิด createdAt, updatedAt
    }
  );

  return StaffDriver;
};
