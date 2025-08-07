// models/index.js
const config = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: "mysql",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.user = require("./user.model.js")(sequelize, Sequelize);
db.role = require("./role.model.js")(sequelize, Sequelize);
db.company = require("./company.model.js")(sequelize, Sequelize);
db.location = require("./location.model.js")(sequelize, Sequelize);
db.review = require("./review.model.js")(sequelize, Sequelize);
db.webcontent = require("./webcontent.model.js")(sequelize, Sequelize);
db.route_pair = require("./routePair.model.js")(sequelize, Sequelize);

db.taxiDriver = require("./taxiDriver.model.js")(sequelize, Sequelize);
db.staffDriver = require("./staffDriver.model.js")(sequelize, Sequelize);
db.taxiPayment = require("./taxiPayment.model.js")(sequelize, Sequelize);
db.taxiTransaction = require("./taxiTransaction.model.js")(
  sequelize,
  Sequelize
);

// User <-> Role (Many-to-Many)
db.role.belongsToMany(db.user, {
  through: "user_roles",
  foreignKey: "roleId",
  otherKey: "userId",
});

db.user.belongsToMany(db.role, {
  through: "user_roles",
  foreignKey: "userId",
  otherKey: "roleId",
});

// User <-> Company (One-to-Many with company_code)
db.user.belongsTo(db.company, {
  foreignKey: "company_code",
  targetKey: "company_code",
});

db.company.hasMany(db.user, {
  foreignKey: "company_code",
  sourceKey: "company_code",
});

// Association: taxiDriver 1 <-> N taxiTransaction
db.taxiDriver.hasMany(db.taxiTransaction, {
  foreignKey: "taxi_id",
  sourceKey: "taxi_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.taxiTransaction.belongsTo(db.taxiDriver, {
  foreignKey: "taxi_id",
  targetKey: "taxi_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Constant for available roles
db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
