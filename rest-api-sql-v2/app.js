"use strict";

const express = require("express");
const morgan = require("morgan");
const routes = require("./routes");
const { sequelize } = require("./models");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// variable to enable global error logging
const enableGlobalErrorLogging =
  process.env.ENABLE_GLOBAL_ERROR_LOGGING === "true";

// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("Connection to the database successful!");
//     console.log("Synchronizing the models with the database...");
//     await sequelize.sync();

//     process.exit();
//   } catch (error) {
//     if (error.name === "SequelizeValidationError") {
//       const errors = error.errors.map((err) => err.message);
//       console.error("Validation errors: ", errors);
//     } else {
//       throw error;
//     }
//   }
// })();

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the REST API project!",
  });
});

app.use("/api", routes);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: "Route Not Found",
  });
});

// global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

app.set("port", process.env.PORT || 5000);

const server = app.listen(app.get("port"), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});





