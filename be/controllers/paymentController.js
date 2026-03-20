const User = require("../models/userModel");
const { sendNotification } = require("../services/sendNotification");
const { ROLES } = require("../config/role");

/**
 * Xử lý webhook từ PayOS
 */
exports.handlePayOSWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    console.log("PayOS Webhook Received:", JSON.stringify(webhookData, null, 2));

    // Verify signature
    const isValid = payOSService.verifyWebhookData(webhookData);
    if (!isValid) {
      console.error("PayOS Webhook Invalid Signature");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const { orderCode, status } = webhookData.data;

    // Tìm booking tương ứng
    const booking = await SpaBooking.findOne({ payOSOrderCode: orderCode });
    if (!booking) {
      console.error("PayOS Webhook: Booking not found for orderCode", orderCode);
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Cập nhật trạng thái
    booking.payOSStatus = status;
    if (status === "PAID" && booking.paymentStatus !== "paid") {
      booking.paymentStatus = "paid";
      await booking.save();

      // Gửi thông báo cho tất cả staff khi thanh toán thành công
      const staffList = await User.find({ role: ROLES.STAFF });
      const notifyPromises = staffList.map((staff) =>
        sendNotification({
          userId: staff._id,
          title: "Booking spa đã thanh toán",
          description: `Booking ${booking.bookingCode} của khách hàng ${booking.customerSnapshot.name} đã được thanh toán thành công.`,
          type: "spa-booking",
          orderId: booking._id,
        })
      );
      await Promise.all(notifyPromises);
    } else {
      await booking.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("PayOS Webhook Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy lịch sử thanh toán cho Staff
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await SpaBooking.find({ paymentStatus: "paid" })
      .populate("customerId", "name email phone")
      .populate("serviceId", "name")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("GET PAYMENT HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy lịch sử thanh toán",
    });
  }
};
