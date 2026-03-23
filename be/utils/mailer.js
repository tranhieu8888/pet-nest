const nodemailer = require("nodemailer");

// console.log("EMAIL_USER =", process.env.EMAIL_USER);
// console.log(
//   "EMAIL_PASSWORD length =",
//   process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0
// );

const hasEmailConfig =
  Boolean(process.env.EMAIL_USER) && Boolean(process.env.EMAIL_PASSWORD);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

if (hasEmailConfig) {
  transporter.verify((error) => {
    if (error) {
      console.error("SMTP verify error:", error.message);
    } else {
      console.log("SMTP server is ready");
    }
  });
} else {
  console.warn(
    "SMTP chưa cấu hình EMAIL_USER/EMAIL_PASSWORD, tạm thời bỏ qua verify mail"
  );
}

exports.sendSubscribeEmail = async (email) => {
  const unsubscribeUrl = `http://localhost:5000/api/subscribers/unsubscribe?email=${encodeURIComponent(
    email
  )}`;

  await transporter.sendMail({
    from: `"PetNest" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Đăng ký nhận tin thành công - PetNest",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Chào bạn 🐶</h2>
        <p>Cảm ơn bạn đã đăng ký nhận thông tin từ PetNest.</p>
        <p>Nếu bạn không muốn nhận email nữa:</p>
        <a
          href="${unsubscribeUrl}"
          style="padding:10px 16px;background:#e11d48;color:#fff;border-radius:8px;text-decoration:none;"
        >
          Hủy đăng ký
        </a>
      </div>
    `,
  });
};
