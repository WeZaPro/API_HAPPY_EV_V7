// models/contactForm.model.js
module.exports = (sequelize, Sequelize) => {
  const ContactForm = sequelize.define("contact_form", {
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    issue: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    bookingRef: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    attachment: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
  });

  return ContactForm;
};
