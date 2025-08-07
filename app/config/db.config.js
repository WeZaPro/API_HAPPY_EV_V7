module.exports = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "",
  DB: process.env.DB_NAME || "happy_ev_taxi",
  dialect: "mysql",
};

// online;
// module.exports = {
//   HOST: process.env.DB_HOST || "localhost",
//   USER: "happy_taxiEv",
//   PASSWORD: "Taweesak5050",
//   DB: "happy_ev_taxi",
//   dialect: "mysql",
// };
