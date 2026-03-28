const express = require("express");
const router = express.Router();

const userController = require("../controllers/users");
const {
  RegisterValidator,
  handleResultValidator,
  ChangPasswordValidator,
} = require("../utils/validatorHandler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { checkLogin } = require("../utils/authHandler");
const crypto = require("crypto");
const { sendMail } = require("../utils/senMailHandler");
const cartSchema = require("../schemas/carts");
const mongoose = require("mongoose");

/* REGISTER */
router.post(
  "/register",
  RegisterValidator,
  handleResultValidator,
  async function (req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newUser = userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        "69aa8360450df994c1ce6c4c"
      );

      await newUser.save({ session });

      const newCart = new cartSchema({
        user: newUser._id,
      });

      await newCart.save({ session });
      await newCart.populate("user");

      await session.commitTransaction();
      await session.endSession();

      res.send({
        message: "dang ki thanh cong",
      });
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();

      res.status(404).send({
        message: error.message,
      });
    }
  }
);

/* LOGIN */
router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;
  const getUser = await userController.FindByUsername(username);

  if (!getUser) {
    return res.status(403).send("tai khoan khong ton tai");
  }

  if (getUser.lockTime && getUser.lockTime > Date.now()) {
    return res.status(403).send("tai khoan dang bi ban");
  }

  if (bcrypt.compareSync(password, getUser.password)) {
    await userController.SuccessLogin(getUser);

    const token = jwt.sign(
      {
        id: getUser._id,
      },
      "secret",
      {
        expiresIn: "30d",
      }
    );

    res.cookie("token_login_tungNT", token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
    });

    return res.send(token);
  } else {
    await userController.FailLogin(getUser);
    return res.status(403).send("thong tin dang nhap khong dung");
  }
});

/* GET ME */
router.get("/me", checkLogin, function (req, res, next) {
  res.send(req.user);
});

/* CHANGE PASSWORD */
router.post(
  "/changepassword",
  checkLogin,
  ChangPasswordValidator,
  function (req, res, next) {
    const { oldpassword, newpassword } = req.body;
    const user = req.user;

    if (bcrypt.compareSync(oldpassword, user.password)) {
      user.password = newpassword;
      user.save();
      return res.send("da doi pass");
    }

    return res.status(400).send("mat khau cu khong dung");
  }
);

/* LOGOUT */
router.post("/logout", checkLogin, function (req, res, next) {
  res.cookie("token_login_tungNT", null, {
    maxAge: 0,
    httpOnly: true,
    secure: false,
  });

  res.send("logout");
});

/* FORGOT PASSWORD */
router.post("/forgotpassword", async function (req, res, next) {
  const email = req.body.email;
  const user = await userController.FindByEmail(email);

  if (user) {
    user.resetPasswordToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenExp = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const url =
      "http://localhost:3000/api/v1/auth/resetpassword/" +
      user.resetPasswordToken;

    await sendMail(user.email, url);
  }

  res.send("check mail de biet");
});

/* RESET PASSWORD */
router.post("/resetpassword/:token", async function (req, res, next) {
  const { password } = req.body;
  const token = req.params.token;

  const user = await userController.FindByToken(token);

  if (!user) {
    return res.status(404).send("token sai");
  }

  if (user.resetPasswordTokenExp > Date.now()) {
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExp = null;
    await user.save();

    return res.send("doi mat khau thanh cong");
  }

  return res.status(400).send("token het han");
});

module.exports = router;