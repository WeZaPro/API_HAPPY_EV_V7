// models/routePair.model.js

module.exports = (sequelize, Sequelize) => {
  const RoutePair = sequelize.define(
    "route_pair",
    {
      A: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      B: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
    },
    {
      tableName: "route_pairs", // ต้องตรงกับใน DB
      timestamps: false,
    }
  );

  return RoutePair;
};
