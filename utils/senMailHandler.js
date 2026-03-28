const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 25,
  secure: false,
  auth: {
    user: "afb2b4ec0e04f7",
    pass: "8054c7f58ead60",
  },
});

module.exports = {
  sendMail: async function (to, url) {
    await transporter.sendMail({
      from: "admin@hehehe.com",
      to: to,
      subject: "reset pass",
      text: "click vo day de doi pass",
      html: `click vo <a href="${url}">day</a> de doi pass`,
    });
  },

  sendAccountMail: async function (to, username, password) {
    await transporter.sendMail({
      from: "admin@hehehe.com",
      to: to,
      subject: "Thong tin tai khoan moi",
      text:
        "Tai khoan cua ban da duoc tao.\n" +
        "Username: " +
        username +
        "\n" +
        "Email: " +
        to +
        "\n" +
        "Password: " +
        password +
        "\n" +
        "Vui long dang nhap va doi mat khau sau do.",
      html: `
        <h2>Thong tin tai khoan moi</h2>
        <p>Tai khoan cua ban da duoc tao thanh cong.</p>
        <p><b>Username:</b> ${username}</p>
        <p><b>Email:</b> ${to}</p>
        <p><b>Password:</b> ${password}</p>
        <p>Vui long dang nhap va doi mat khau sau do.</p>
      `,
    });
  },
};