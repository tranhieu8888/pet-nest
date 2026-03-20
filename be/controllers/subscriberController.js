const mongoose = require("mongoose");
const Subscriber = require("../models/subscriberModel");
const { sendSubscribeEmail } = require("../utils/mailer");
const { notifyAdmin } = require("../utils/adminHelper");
const { getUnsubscribeSuccessView } = require("../utils/viewHelper");

// POST /api/subscribers
exports.createSubscriber = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email là bắt buộc" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Email không hợp lệ" });
    }

    let subscriber = await Subscriber.findOne({ email: normalizedEmail });
    let isNewSubscriber = !subscriber;

    if (subscriber) {
      if (subscriber.status === "active") {
        return res.status(400).json({ success: false, message: "Email này đã đăng ký trước đó" });
      }
      subscriber.status = "active";
    } else {
      subscriber = new Subscriber({ email: normalizedEmail, status: "active" });
    }
    
    await subscriber.save();

    // Async tasks
    sendSubscribeEmail(subscriber.email).catch(e => console.error("Mail Error:", e.message));
    
    notifyAdmin({
      title: "Đăng ký email mới",
      description: isNewSubscriber 
        ? `Email ${subscriber.email} vừa đăng ký nhận tin.`
        : `Email ${subscriber.email} đã kích hoạt lại đăng ký nhận tin.`,
      type: "subscriber",
    });

    return res.status(isNewSubscriber ? 201 : 200).json({
      success: true,
      message: isNewSubscriber ? "Đăng ký thành công!" : "Đăng ký lại thành công!",
      data: subscriber,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscribers
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: subscribers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/subscribers/:id/unsubscribe
exports.unsubscribeSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const subscriber = await Subscriber.findByIdAndUpdate(id, { status: "unsubscribed" }, { new: true });
    if (!subscriber) {
      return res.status(404).json({ success: false, message: "Không tìm thấy email đăng ký" });
    }

    return res.status(200).json({ success: true, message: "Đã hủy đăng ký", data: subscriber });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/subscribers/:id/activate
exports.activateSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const subscriber = await Subscriber.findByIdAndUpdate(id, { status: "active" }, { new: true });
    if (!subscriber) {
      return res.status(404).json({ success: false, message: "Không tìm thấy email đăng ký" });
    }

    return res.status(200).json({ success: true, message: "Kích hoạt lại thành công", data: subscriber });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/subscribers/:id
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const subscriber = await Subscriber.findByIdAndDelete(id);
    if (!subscriber) {
      return res.status(404).json({ success: false, message: "Không tìm thấy email đăng ký" });
    }

    return res.status(200).json({ success: true, message: "Xóa email đăng ký thành công" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscribers/unsubscribe?email=...
exports.unsubscribeByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).send("Thiếu email để hủy đăng ký");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const subscriber = await Subscriber.findOne({ email: normalizedEmail });

    if (!subscriber) {
      return res.status(404).send(`Không tìm thấy email: ${normalizedEmail}`);
    }

    subscriber.status = "unsubscribed";
    await subscriber.save();

    return res.status(200).send(getUnsubscribeSuccessView(normalizedEmail));
  } catch (error) {
    return res.status(500).send(`Có lỗi xảy ra: ${error.message}`);
  }
};
