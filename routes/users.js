const express = require("express");
const router = express.Router();

const { checkLogin, CheckPermission } = require("../utils/authHandler");
const {
  userCreateValidator,
  userUpdateValidator,
  handleResultValidator,
} = require("../utils/validatorHandler");

const userController = require("../controllers/users");
const userModel = require("../schemas/users");
const { uploadExcel } = require("../utils/upload");

/* GET ALL USERS */
router.get(
  "/",
  checkLogin,
  CheckPermission("ADMIN"),
  async function (req, res, next) {
    try {
      const users = await userController.GetAllUser();
      res.send(users);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  }
);

/* IMPORT USERS FROM EXCEL */
router.post(
  "/import-excel",
  uploadExcel.single("file"),
  async function (req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).send({
          message: "Vui long chon file excel",
        });
      }

      const result = await userController.ImportUsersFromExcel(req.file.path);

      res.send({
        message: "Import user thanh cong",
        result: result,
      });
    } catch (error) {
      res.status(400).send({
        message: error.message,
      });
    }
  }
);

/* GET USER BY ID */
router.get("/:id", async function (req, res, next) {
  try {
    const result = await userModel
      .findOne({
        _id: req.params.id,
        isDeleted: false,
      })
      .populate({
        path: "role",
        select: "name",
      });

    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

/* CREATE USER */
router.post(
  "/",
  userCreateValidator,
  handleResultValidator,
  async function (req, res, next) {
    try {
      const newItem = userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        req.body.role,
        req.body.fullName,
        req.body.avatarUrl,
        req.body.status,
        req.body.loginCount
      );

      await newItem.save();

      const saved = await userModel.findById(newItem._id).populate({
        path: "role",
        select: "name",
      });

      res.send(saved);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  }
);

/* UPDATE USER */
router.put(
  "/:id",
  userUpdateValidator,
  handleResultValidator,
  async function (req, res, next) {
    try {
      const id = req.params.id;

      const updatedItem = await userModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!updatedItem) {
        return res.status(404).send({ message: "id not found" });
      }

      const populated = await userModel.findById(updatedItem._id).populate({
        path: "role",
        select: "name",
      });

      res.send(populated);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  }
);

/* DELETE USER (SOFT DELETE) */
router.delete("/:id", async function (req, res, next) {
  try {
    const id = req.params.id;

    const updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }

    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;