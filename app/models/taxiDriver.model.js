module.exports = (sequelize, Sequelize) => {
  const TaxiDriver = sequelize.define(
    "taxiDriver",
    {
      taxi_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      taxi_lpr: {
        type: Sequelize.STRING,
      },
      link_staff_id: {
        type: Sequelize.STRING, // ใช้สำหรับเชื่อมกับ staffDriver.staffDriver_id
        allowNull: true,
        field: "staffDriver_id", // บอก Sequelize ว่าคอลัมน์จริงชื่อ staffDriver_id
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
      tableName: "taxiDriver", // บังคับชื่อตาราง
      timestamps: true,
    }
  );

  return TaxiDriver;
};
