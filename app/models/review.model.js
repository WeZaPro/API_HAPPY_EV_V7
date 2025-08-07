// models/review.model.js

module.exports = (sequelize, Sequelize) => {
  const Review = sequelize.define(
    "reviews",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customer: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      review: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rating: {
        type: Sequelize.TINYINT, // หรือ Sequelize.INTEGER ถ้าไม่ใช้ TINYINT
        allowNull: false,
        defaultValue: 5,
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "reviews",
      timestamps: false, // ปิดถ้าไม่ใช้ createdAt/updatedAt
    }
  );

  return Review;
};
