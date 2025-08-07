// models/location.model.js

module.exports = (sequelize, Sequelize) => {
  const Location = sequelize.define(
    "location",
    {
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "location", // ✅ Fix table name ตรงกับใน MySQL
      timestamps: false, // ❌ ปิด timestamps ถ้า table ไม่มี createdAt/updatedAt
    }
  );

  return Location;
};
