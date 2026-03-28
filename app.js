const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// domain:port/api/v1/products
// domain:port/api/v1/users
// domain:port/api/v1/categories
// domain:port/api/v1/roles

mongoose.connect("mongodb://localhost:27017/NNPTUD-C6");

mongoose.connection.on("connected", function () {
  console.log("connected");
});

mongoose.connection.on("disconnected", function () {
  console.log("disconnected");
});

app.use("/", require("./routes/index"));
app.use("/api/v1/users", require("./routes/users"));
app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/roles", require("./routes/roles"));
app.use("/api/v1/products", require("./routes/products"));
app.use("/api/v1/categories", require("./routes/categories"));
app.use("/api/v1/carts", require("./routes/carts"));
app.use("/api/v1/upload", require("./routes/upload"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.send(err.message);
});

module.exports = app;