const Notification = require("../models/notificationModel");
const { sendNotification } = require("../utils/sendNotification");

exports.getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    if (typeof isRead !== "boolean") {
      return res.status(400).json({ message: "isRead must be boolean" });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy notification" });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Bạn không có quyền xem notification này",
      });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { userId, title, description, type, orderId, ticketId } = req.body;

    if (!userId || !title || !type) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const notification = await sendNotification({
      userId,
      title,
      description,
      type,
      orderId,
      ticketId,
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy notification" });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa notification này",
      });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({ message: "Đã xóa notification thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.deleteMany({ userId });
    res.status(200).json({ message: "Đã xóa tất cả notification của bạn" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
