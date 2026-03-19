const mongoose = require("mongoose");
const Subscriber = require("../models/subscriberModel");
const { sendSubscribeEmail } = require("../utils/mailer");
const User = require("../models/userModel");
const { sendNotification } = require("../utils/sendNotification");

// POST /api/subscribers
exports.createSubscriber = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    let subscriber = await Subscriber.findOne({ email: normalizedEmail });
    let isNewSubscriber = false;

    if (subscriber) {
      if (subscriber.status === "active") {
        return res.status(400).json({
          success: false,
          message: "Email này đã đăng ký trước đó",
        });
      }

      subscriber.status = "active";
      await subscriber.save();
    } else {
      subscriber = new Subscriber({
        email: normalizedEmail,
        status: "active",
      });
      await subscriber.save();
      isNewSubscriber = true;
    }

    try {
      await sendSubscribeEmail(subscriber.email);
    } catch (mailError) {
      console.error("Lỗi gửi email:", mailError.message);
    }

    try {
      const admin = await User.findOne({ role: 0 }).select("_id");

      if (admin) {
        await sendNotification({
          userId: admin._id.toString(),
          title: "Đăng ký email mới",
          description: isNewSubscriber
            ? `Email ${subscriber.email} vừa đăng ký nhận tin.`
            : `Email ${subscriber.email} đã kích hoạt lại đăng ký nhận tin.`,
          type: "subscriber",
        });
      } else {
        console.warn("Không tìm thấy admin để gửi notification");
      }
    } catch (notifyError) {
      console.error("Lỗi tạo notification cho admin:", notifyError.message);
    }

    return res.status(isNewSubscriber ? 201 : 200).json({
      success: true,
      message: isNewSubscriber
        ? "Đăng ký thành công, vui lòng kiểm tra email"
        : "Đăng ký lại thành công, vui lòng kiểm tra email",
      data: subscriber,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/subscribers
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: subscribers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/subscribers/:id/unsubscribe
exports.unsubscribeSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const subscriber = await Subscriber.findById(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy email đăng ký",
      });
    }

    subscriber.status = "unsubscribed";
    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: "Đã hủy đăng ký",
      data: subscriber,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/subscribers/:id/activate
exports.activateSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const subscriber = await Subscriber.findById(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy email đăng ký",
      });
    }

    subscriber.status = "active";
    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: "Kích hoạt lại thành công",
      data: subscriber,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/subscribers/:id
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const subscriber = await Subscriber.findById(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy email đăng ký",
      });
    }

    await Subscriber.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa email đăng ký thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/subscribers/unsubscribe?email=...
exports.unsubscribeByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Thiếu email để hủy đăng ký</h2>
        </div>
      `);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const subscriber = await Subscriber.findOne({ email: normalizedEmail });

    if (!subscriber) {
      return res.status(404).send(`
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Không tìm thấy email trong hệ thống</h2>
          <p>Email: ${normalizedEmail}</p>
        </div>
      `);
    }

    subscriber.status = "unsubscribed";
    await subscriber.save();

    return res.status(200).send(`
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Hủy đăng ký thành công</title>

<style>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family: system-ui, -apple-system, Arial;
}

body{
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background: linear-gradient(135deg,#667eea,#764ba2);
}

.card{
  background:white;
  padding:50px;
  border-radius:16px;
  text-align:center;
  max-width:420px;
  box-shadow:0 20px 40px rgba(0,0,0,0.15);
}

.icon{
  font-size:70px;
  margin-bottom:15px;
}

h2{
  font-size:26px;
  margin-bottom:10px;
  color:#222;
}

p{
  color:#555;
  line-height:1.6;
}

.email{
  font-weight:600;
  color:#111;
}

.btn{
  display:inline-block;
  margin-top:25px;
  padding:12px 24px;
  background:#667eea;
  color:white;
  text-decoration:none;
  border-radius:8px;
  font-weight:600;
  transition:0.2s;
}

.btn:hover{
  background:#5a67d8;
}
</style>

</head>

<body>

<div class="card">

<div class="icon">✅</div>

<h2>Bạn đã hủy đăng ký</h2>

<p>
Email <span class="email">${normalizedEmail}</span><br>
sẽ không nhận email marketing nữa.
</p>

<a class="btn" href="http://localhost:3000/homepage">Quay lại trang chủ</a>

</div>

</body>
</html>
`);
  } catch (error) {
    return res.status(500).send(`
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Có lỗi xảy ra</h2>
        <p>${error.message}</p>
      </div>
    `);
  }
};
