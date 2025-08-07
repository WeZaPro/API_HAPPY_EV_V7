module.exports = (sequelize, Sequelize) => {
  const TaxiTransaction = sequelize.define(
    "taxiTransaction",
    {
      Happy_Booking_ID: {
        type: Sequelize.STRING,
      },
      taxi_id: {
        type: Sequelize.STRING,
      },
      taxi_lpr: {
        type: Sequelize.STRING,
      },
      start: {
        type: Sequelize.STRING,
      },
      destination: {
        type: Sequelize.STRING,
      },
      return_way: {
        type: Sequelize.BOOLEAN,
      },
      date_go: {
        type: Sequelize.DATEONLY,
      },
      status_go: {
        type: Sequelize.BOOLEAN,
      },
      date_back: {
        type: Sequelize.DATEONLY,
      },
      status_back: {
        type: Sequelize.BOOLEAN,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
      },
      paid: {
        type: Sequelize.DECIMAL(10, 2),
      },
      paid_status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      confirm: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "taxiTransaction",
      timestamps: true,
    }
  );

  return TaxiTransaction;
};
