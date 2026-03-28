const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageSetting = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name =
      Date.now() + "-" + Math.round(Math.random() * 2000000000) + ext;
    cb(null, name);
  },
});

const filterImage = function (req, file, cb) {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("file dinh dang khong dung"));
  }
};

const filterExcel = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    ext === ".xlsx" ||
    ext === ".xls" ||
    file.mimetype.includes("spreadsheetml") ||
    file.mimetype.includes("excel")
  ) {
    cb(null, true);
  } else {
    cb(new Error("file dinh dang khong dung"));
  }
};

const uploadImage = multer({
  storage: storageSetting,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: filterImage,
});

const uploadExcel = multer({
  storage: storageSetting,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: filterExcel,
});

module.exports = {
  uploadImage,
  uploadExcel,
};