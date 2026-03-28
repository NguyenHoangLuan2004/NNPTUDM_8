const userModel = require("../schemas/users");
const roleModel = require("../schemas/roles");
const XLSX = require("xlsx");
const fs = require("fs");
const { sendAccountMail } = require("../utils/senMailHandler");

function generateRandomPassword(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

module.exports = {
  CreateAnUser: function (
    username,
    password,
    email,
    role,
    fullname,
    avatar,
    status,
    logincount
  ) {
    return new userModel({
      username: username,
      password: password,
      email: email,
      fullName: fullname,
      avatarUrl: avatar,
      status: status,
      role: role,
      loginCount: logincount,
    });
  },

  FindByUsername: async function (username) {
    return await userModel.findOne({
      username: username,
      isDeleted: false,
    });
  },

  FindByEmail: async function (email) {
    return await userModel.findOne({
      email: email,
      isDeleted: false,
    });
  },

  FindByToken: async function (token) {
    return await userModel.findOne({
      resetPasswordToken: token,
      isDeleted: false,
    });
  },

  FailLogin: async function (user) {
    user.loginCount++;

    if (user.loginCount == 3) {
      user.loginCount = 0;
      user.lockTime = new Date(Date.now() + 60 * 60 * 1000);
    }

    await user.save();
  },

  SuccessLogin: async function (user) {
    user.loginCount = 0;
    await user.save();
  },

  GetAllUser: async function () {
    return await userModel.find({ isDeleted: false }).populate({
      path: "role",
      select: "name",
    });
  },

  FindById: async function (id) {
    try {
      const getUser = await userModel
        .findOne({ _id: id, isDeleted: false })
        .populate({
          path: "role",
          select: "name",
        });

      return getUser;
    } catch (error) {
      return false;
    }
  },

  ImportUsersFromExcel: async function (filePath) {
    const result = {
      total: 0,
      created: 0,
      skipped: 0,
      mailSent: 0,
      errors: [],
    };

    try {
      const roleUser = await roleModel.findOne({
        name: "user",
        isDeleted: false,
      });

      if (!roleUser) {
        throw new Error("Khong tim thay role user trong database");
      }

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: "",
      });

      result.total = rows.length;

      for (const row of rows) {
        const username = String(row.username || "").trim();
        const email = String(row.email || "").trim().toLowerCase();

        if (!username || !email) {
          result.skipped++;
          result.errors.push({
            username,
            email,
            reason: "Thieu username hoac email",
          });
          continue;
        }

        const existedUser = await userModel.findOne({
          $or: [{ username: username }, { email: email }],
          isDeleted: false,
        });

        if (existedUser) {
          result.skipped++;
          result.errors.push({
            username,
            email,
            reason: "User da ton tai",
          });
          continue;
        }

        const rawPassword = generateRandomPassword(16);

        const newUser = new userModel({
          username: username,
          email: email,
          password: rawPassword,
          role: roleUser._id,
          fullName: "",
          status: false,
          loginCount: 0,
        });

        await newUser.save();
        result.created++;

        try {
          await sendAccountMail(email, username, rawPassword);
          result.mailSent++;
        } catch (mailError) {
          result.errors.push({
            username,
            email,
            reason: "Gui mail that bai: " + mailError.message,
          });
        }
      }

      return result;
    } catch (error) {
      throw error;
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
};