const Notification = require("../models/notificationModel");
const { getIO } = require("../config/socket.io");

async function sendNotification({
  userId,
  title,
  description,
  type,
  orderId,
  ticketId,
}) {
  if (!userId || !title || !type) {
    throw new Error("Thiếu thông tin bắt buộc khi gửi notification");
  }

  const notification = new Notification({
    userId,
    title,
    description,
    type,
    orderId,
    ticketId,
  });

  await notification.save();
  console.log("[Notification] Saved:", notification._id.toString());

  try {
    const io = getIO();
    io.to(userId.toString()).emit("notification", notification);
    console.log("[Notification] Emitted to room:", userId.toString());
  } catch (error) {
    console.error("[Notification] Socket emit error:", error);
  }

  return notification;
}

module.exports = { sendNotification };
