// models/webcontent.model.js

module.exports = (sequelize, Sequelize) => {
  const WebContent = sequelize.define(
    "webcontent",
    {
      title: {
        type: Sequelize.STRING,
      },
      detailweb: {
        type: Sequelize.STRING,
      },
      imageUrl: {
        type: Sequelize.STRING,
      },

      typeContent: {
        type: Sequelize.STRING,
      },

      languageContent: {
        type: Sequelize.STRING,
      },

      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "webcontent",
      timestamps: false,
    }
  );

  return WebContent;
};
