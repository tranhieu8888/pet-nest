const User = require("../models/userModel");
const SpaBooking = require("../models/spaBookingModel");
const payOSService = require("../services/payOSService");
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

    // Đặc biệt: PayOS sẽ gửi mã 123 để kiểm tra Webhook. 
    // Chúng ta trả về 200 để xác thực Webhook hoạt động.
    if (orderCode === 123) {
      console.log("PayOS Webhook: Test ping received (orderCode 123). Success.");
      return res.status(200).json({ success: true, message: "Test webhook received" });
    }

    // Tìm booking tương ứng
    const booking = await SpaBooking.findOne({ payOSOrderCode: orderCode });
    if (!booking) {
      console.error("PayOS Webhook: Booking not found for orderCode", orderCode);
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Cập nhật trạng thái
    console.log(`PayOS Webhook: Updating booking ${booking.bookingCode}. Status: ${status}`);
    booking.payOSStatus = status;
    
    if (status === "PAID" && booking.paymentStatus !== "paid") {
      console.log(`PayOS Webhook: Setting paymentStatus to 'paid' for booking ${booking.bookingCode}`);
      booking.paymentStatus = "paid";
      await booking.save();
      console.log(`PayOS Webhook: Saved booking ${booking.bookingCode} successfully.`);

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
    const payments = await SpaBooking.find({ 
      paymentStatus: "paid",
      status: "completed"
    })
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

/**
 * Chủ động đồng bộ trạng thái thanh toán từ PayOS (Dùng khi Webhook bị chậm/lỗi)
 */
exports.syncPaymentStatus = async (req, res) => {
  try {
    const { orderCode } = req.body;
    if (!orderCode) {
      return res.status(400).json({ success: false, message: "Thiếu orderCode" });
    }

    // 1. Lấy thông tin từ PayOS
    const payOSInfo = await payOSService.getPaymentLinkInformation(orderCode);
    if (!payOSInfo) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin trên PayOS" });
    }

    // 2. Tìm booking trong DB
    const booking = await SpaBooking.findOne({ payOSOrderCode: orderCode });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy booking trong hệ thống" });
    }

    // 3. Cập nhật nếu trạng thái là PAID
    const status = payOSInfo.status;
    booking.payOSStatus = status;

    if (status === "PAID" && booking.paymentStatus !== "paid") {
      booking.paymentStatus = "paid";
      await booking.save();

      // Gửi thông báo cho staff
      const staffList = await User.find({ role: ROLES.STAFF });
      const notifyPromises = staffList.map((staff) =>
        sendNotification({
          userId: staff._id,
          title: "Booking đã thanh toán (Sync)",
          description: `Booking ${booking.bookingCode} đã được thanh toán (Đồng bộ thủ công).`,
          type: "spa-booking",
          orderId: booking._id,
        })
      );
      await Promise.all(notifyPromises);
      
      return res.status(200).json({ success: true, message: "Đã cập nhật trạng thái: Đã thanh toán", status: "PAID" });
    }

    await booking.save();
    return res.status(200).json({ success: true, message: "Trạng thái hiện tại: " + status, status });

  } catch (error) {
    console.error("SYNC PAYMENT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
