module.exports = (sequelize, Sequelize) => {
  const Company = sequelize.define(
    "company",
    {
      company_name: {
        type: Sequelize.STRING,
      },
      company_code: {
        type: Sequelize.STRING,
        unique: true,
      },
      code_emp: {
        type: Sequelize.JSON,
      },
      image_url: {
        // เพิ่ม field สำหรับเก็บ URL รูปภาพ
        type: Sequelize.STRING,
        allowNull: true, // รูปภาพอาจจะไม่มีได้
      },
    },
    {
      tableName: "company", // บังคับชื่อ table ให้ตรงกับฐานข้อมูลจริง
      timestamps: true, // เปิด createdAt, updatedAt
    }
  );

  return Company;
};
