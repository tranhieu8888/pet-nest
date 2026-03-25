const mongoose = require("mongoose");
const SpaBooking = require("../models/spaBookingModel");
const User = require("../models/userModel");
const StaffSchedule = require("../models/staffScheduleModel");
const { sendNotification } = require("../services/sendNotification");

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

function getVNMinutes(dateInput) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: VN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(dateInput));

  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);

  return hour * 60 + minute;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;

  const [hour, minute] = timeStr.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  return hour * 60 + minute;
}

const moment = require("moment-timezone");

// STAFF xem danh sách booking
exports.getStaffSpaBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const staffId = req.user?.id || req.user?._id || req.user?.userId;

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được nhân viên đăng nhập",
      });
    }

    // 1. Lấy tất cả các ngày làm việc của staff này để filter đơn pending
    const staffSchedules = await StaffSchedule.find({
      staffId,
      isOff: false,
      isDeleted: false,
    }).select("workDate");

    const workDates = staffSchedules.map((s) =>
      moment.tz(s.workDate, VN_TIMEZONE).format("YYYY-MM-DD")
    );

    let filter = {};

    if (status === "pending") {
      filter = {
        status: "pending",
        rejectedByStaffIds: { $ne: staffId },
      };
    } else if (status === "confirmed") {
      filter = { status: "confirmed", staffId };
    } else if (status === "completed") {
      filter = { status: "completed", staffId };
    } else if (status === "cancelled") {
      filter = { status: "cancelled", staffId };
    } else {
      filter = {
        $or: [
          {
            status: "pending",
            rejectedByStaffIds: { $ne: staffId },
          },
          {
            status: { $in: ["confirmed", "completed", "cancelled"] },
            staffId,
          },
        ],
      };
    }

    const bookings = await SpaBooking.find(filter)
      .populate("customerId", "name phone email")
      .populate("petId", "name type breed age weight")
      .populate("serviceId", "name slug category price durationMinutes image")
      .populate("staffId", "name phone email")
      .sort({ createdAt: -1 });

    // 2. Filter thủ công kết quả dựa trên ngày làm việc cho các đơn "pending"
    // Chỉ những đơn pending có ngày bắt đầu trùng với ngày làm việc mới được hiển thị
    const filteredBookings = bookings.filter((b) => {
      if (b.status !== "pending") return true; // Các đơn đã confirm/completed giữ nguyên

      const bookingDate = moment.tz(b.startAt, VN_TIMEZONE).format("YYYY-MM-DD");
      return workDates.includes(bookingDate);
    });

    return res.status(200).json({
      success: true,
      data: filteredBookings,
    });
  } catch (e) {
    console.error("GET STAFF SPA BOOKINGS ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy danh sách booking",
    });
  }
};

// STAFF xem chi tiết
exports.getStaffSpaBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    const booking = await SpaBooking.findById(id)
      .populate("customerId", "name phone email")
      .populate(
        "petId",
        "name type breed age weight note allergies behaviorNote"
      )
      .populate("serviceId", "name slug category price durationMinutes image")
      .populate("staffId", "name phone email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (e) {
    console.error("GET STAFF SPA BOOKING BY ID ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy chi tiết booking",
    });
  }
};

// STAFF xác nhận booking
exports.confirmSpaBooking = async (req, res) => {
  try {
    const staffId = req.user?.id || req.user?._id || req.user?.userId;
    const { id } = req.params;

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được nhân viên đăng nhập",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    const booking = await SpaBooking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ booking đang chờ xác nhận mới có thể xác nhận",
      });
    }

    if (
      Array.isArray(booking.rejectedByStaffIds) &&
      booking.rejectedByStaffIds.some(
        (item) => String(item) === String(staffId)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã từ chối booking này, không thể nhận lại",
      });
    }

    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    // 1. Tìm lịch làm việc của staff này trong ngày của booking
    // Cần normalize ngày của booking giống như cách lưu trong StaffSchedule (VN 00:00)
    const bookingDateNormalized = moment.tz(booking.startAt, VN_TIMEZONE).startOf("day").toDate();

    const schedule = await StaffSchedule.findOne({
      staffId,
      workDate: bookingDateNormalized,
      isOff: false,
      isDeleted: false,
    });

    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: "Bạn không có lịch làm việc trong ngày này hoặc đã được nghỉ",
      });
    }

    // 2. Kiểm tra khung giờ nghiêm ngặt: Đơn hàng phải nằm trong ca làm việc
    const shiftStartMinutes = parseTimeToMinutes(schedule.shiftStart);
    const shiftEndMinutes =
      parseTimeToMinutes(schedule.shiftEnd) + (schedule.overtimeHours || 0) * 60;
    const bookingStartMinutes = getVNMinutes(booking.startAt);
    const bookingEndMinutes = getVNMinutes(booking.endAt);

    if (
      shiftStartMinutes === null ||
      shiftEndMinutes === null ||
      bookingStartMinutes < shiftStartMinutes ||
      bookingEndMinutes > shiftEndMinutes
    ) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng này (${schedule.shiftStart} - ${schedule.shiftEnd}) nằm ngoài ca làm việc của bạn`,
      });
    }

    const conflictBooking = await SpaBooking.findOne({
      _id: { $ne: booking._id },
      staffId,
      status: "confirmed",
      startAt: { $lt: booking.endAt },
      endAt: { $gt: booking.startAt },
    });

    if (conflictBooking) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên đã có booking trùng thời gian",
      });
    }

    booking.staffId = staff._id;
    booking.staffSnapshot = {
      name: staff.name || "",
      phone: staff.phone || "",
    };
    booking.status = "confirmed";
    booking.rejectedByStaffIds = [];

    await booking.save();

    if (booking && booking.customerId) {
      await sendNotification({
        userId: booking.customerId,
        title: "Booking spa đã được xác nhận",
        description: `Booking dịch vụ '${
          booking.serviceSnapshot?.name || ""
        }' cho thú cưng '${
          booking.petSnapshot?.name || ""
        }' đã được nhân viên xác nhận.`,
        type: "spa-booking",
        orderId: booking._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác nhận booking thành công",
      data: booking,
    });
  } catch (e) {
    console.error("CONFIRM SPA BOOKING ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi xác nhận booking",
    });
  }
};

// STAFF từ chối booking
exports.rejectSpaBooking = async (req, res) => {
  try {
    const staffId = req.user?.id || req.user?._id || req.user?.userId;
    const { id } = req.params;
    const { reason = "" } = req.body;

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được nhân viên đăng nhập",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    const booking = await SpaBooking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ booking đang chờ xác nhận mới có thể từ chối",
      });
    }

    const staff = await User.findById(staffId).select("name phone");
    const rejectReason = String(reason || "").trim();

    const logLine = [
      `[${new Date().toISOString()}]`,
      `Staff: ${staff?.name || "Không rõ"}`,
      "Từ chối nhận booking",
      rejectReason ? `Lý do: ${rejectReason}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    booking.staffId = null;
    booking.staffSnapshot = {
      name: "",
      phone: "",
    };
    booking.status = "pending";
    booking.cancelledAt = null;
    booking.cancellationReason = "";

    if (
      !booking.rejectedByStaffIds.some(
        (item) => String(item) === String(staffId)
      )
    ) {
      booking.rejectedByStaffIds.push(staffId);
    }

    booking.internalNote = booking.internalNote
      ? `${booking.internalNote}\n${logLine}`
      : logLine;

    await booking.save();

    if (booking && booking.customerId) {
      await sendNotification({
        userId: booking.customerId,
        title: "Booking spa bị từ chối",
        description: `Booking dịch vụ '${
          booking.serviceSnapshot?.name || ""
        }' cho thú cưng '${
          booking.petSnapshot?.name || ""
        }' đã bị từ chối bởi nhân viên.`,
        type: "spa-booking",
        orderId: booking._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã từ chối nhận booking. Booking sẽ chuyển cho nhân viên khác",
      data: booking,
    });
  } catch (e) {
    console.error("REJECT SPA BOOKING ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi từ chối booking",
    });
  }
};

// STAFF hoàn tất booking
exports.completeSpaBooking = async (req, res) => {
  try {
    const staffId = req.user?.id || req.user?._id || req.user?.userId;
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được nhân viên đăng nhập",
      });
    }

    const booking = await SpaBooking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (!booking.staffId || String(booking.staffId) !== String(staffId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thao tác booking này",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ booking đã xác nhận mới có thể hoàn tất",
      });
    }

    booking.status = "completed";
    booking.checkedOutAt = new Date();

    if (["paid", "unpaid"].includes(paymentStatus)) {
      booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    if (booking && booking.customerId) {
      await sendNotification({
        userId: booking.customerId,
        title: "Booking spa đã hoàn tất",
        description: `Booking dịch vụ '${
          booking.serviceSnapshot?.name || ""
        }' cho thú cưng '${booking.petSnapshot?.name || ""}' đã được hoàn tất.`,
        type: "spa-booking",
        orderId: booking._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hoàn tất booking thành công",
      data: booking,
    });
  } catch (e) {
    console.error("COMPLETE SPA BOOKING ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi hoàn tất booking",
    });
  }
};

// STAFF đánh dấu đã thanh toán
exports.markAsPaid = async (req, res) => {
  try {
    const staffId = req.user?.id || req.user?._id || req.user?.userId;
    const { id } = req.params;

    const booking = await SpaBooking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (!booking.staffId || String(booking.staffId) !== String(staffId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật booking này",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ booking đã hoàn tất mới có thể cập nhật thanh toán",
      });
    }

    booking.paymentStatus = "paid";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Đã cập nhật trạng thái thanh toán",
      data: booking,
    });
  } catch (e) {
    console.error("MARK AS PAID ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi cập nhật thanh toán",
    });
  }
};
