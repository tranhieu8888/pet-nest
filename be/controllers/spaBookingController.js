const mongoose = require("mongoose");
const SpaBooking = require("../models/spaBookingModel");
const SpaService = require("../models/spaServiceModel");
const User = require("../models/userModel");
const Pet = require("../models/petModel");
const { sendNotification } = require("../services/sendNotification");
const { ROLES } = require("../config/role");

function generateBookingCode() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SPA-${Date.now()}-${random}`;
}

const payOSService = require("../services/payOSService");

// ================= CREATE =================
exports.createSpaBooking = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id || req.user?.userId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được người dùng đăng nhập",
      });
    }

    const { petId, serviceSlug, startAt, note = "" } = req.body;

    if (!petId || !serviceSlug || !startAt) {
      return res.status(400).json({
        success: false,
        message: "Thiếu petId, serviceSlug hoặc startAt",
      });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách hàng",
      });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thú cưng",
      });
    }

    if (
      String(pet.customerId || pet.userId || pet.ownerId) !== String(customerId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền đặt lịch cho thú cưng này",
      });
    }

    const service = await SpaService.findOne({
      slug: serviceSlug,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ spa",
      });
    }

    if (
      Array.isArray(service.petTypes) &&
      service.petTypes.length > 0 &&
      !service.petTypes.includes(pet.type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Dịch vụ này không áp dụng cho loại thú cưng đã chọn",
      });
    }

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Thời gian bắt đầu không hợp lệ",
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Không thể đặt lịch trong quá khứ",
      });
    }

    const endDate = new Date(
      startDate.getTime() + service.durationMinutes * 60 * 1000
    );

    const existingBooking = await SpaBooking.findOne({
      petId,
      status: { $in: ["pending", "confirmed"] },
      startAt: { $lt: endDate },
      endAt: { $gt: startDate },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "Thú cưng đã có lịch trùng thời gian",
      });
    }

    const payOSOrderCode = Number(String(Date.now()).slice(-9));

    // Tính toán tiền cọc 50%
    const totalPrice = service.price;
    const depositAmount = Math.round(totalPrice * 0.5); // Làm tròn số tiền cọc

    const booking = await SpaBooking.create({
      bookingCode: generateBookingCode(),
      customerId,
      petId,
      serviceId: service._id,
      staffId: null,
      rejectedByStaffIds: [],

      customerSnapshot: {
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
      },

      petSnapshot: {
        name: pet.name || "",
        type: pet.type,
        breed: pet.breed || "",
        age: pet.age ?? null,
        weight: pet.weight ?? null,
        note: pet.note || "",
        allergies: pet.allergies || "",
        behaviorNote: pet.behaviorNote || "",
        image: pet.image || "",
      },

      serviceSnapshot: {
        name: service.name,
        category: service.category,
        price: totalPrice, // Lưu giá gốc 100%
        durationMinutes: service.durationMinutes,
      },

      staffSnapshot: {
        name: "",
        phone: "",
      },

      startAt: startDate,
      endAt: endDate,
      note: String(note || "").trim(),
      status: "pending",
      paymentStatus: "unpaid",
      internalNote: "",
      cancelledAt: null,
      cancellationReason: "",

      // PayOS Default
      payOSOrderCode: payOSOrderCode,
      payOSStatus: "PENDING",

      // Financials
      totalPrice: totalPrice,
      depositAmount: depositAmount,
    });

    // Tạo link thanh toán PayOS - Chỉ thanh toán số tiền cọc 50%
    const paymentLinkRes = await payOSService.createPaymentLink({
      orderCode: payOSOrderCode,
      amount: depositAmount,
      description: `Coc 50% BKG ${payOSOrderCode}`,
      cancelUrl: `http://localhost:3000/my-spa-bookings`,
      returnUrl: `http://localhost:3000/my-spa-bookings`,
    });

    if (paymentLinkRes) {
      booking.payOSPaymentLink = paymentLinkRes.checkoutUrl;
      await booking.save();
    }

    return res.status(201).json({
      success: true,
      message: "Đặt lịch spa thành công",
      data: booking,
      checkoutUrl: paymentLinkRes?.checkoutUrl || null,
    });
  } catch (e) {
    console.error("CREATE SPA BOOKING ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi tạo booking spa",
    });
  }
};

// ================= LIST =================
exports.getMySpaBookings = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id || req.user?.userId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được người dùng đăng nhập",
      });
    }

    // Chỉ hiển thị các booking đã thanh toán HOẶC đã hủy (để người dùng theo dõi)
    // Ẩn các booking "Chưa thanh toán" mà vẫn đang ở trạng thái pending (vì người dùng chưa hoàn tất thanh toán)
    const bookings = await SpaBooking.find({
      customerId,
      $or: [{ paymentStatus: "paid" }, { status: "cancelled" }],
    })
      .populate("serviceId", "name slug image")
      .populate("petId", "name type breed")
      .populate("staffId", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (e) {
    console.error("GET MY SPA BOOKINGS ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy danh sách booking",
    });
  }
};

// ================= DETAIL =================
exports.getSpaBookingById = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id || req.user?.userId;
    const { id } = req.params;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được người dùng đăng nhập",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    const booking = await SpaBooking.findById(id)
      .populate("serviceId", "name slug image")
      .populate("petId", "name type breed")
      .populate("staffId", "name phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (String(booking.customerId) !== String(customerId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem booking này",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (e) {
    console.error("GET SPA BOOKING BY ID ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy chi tiết booking",
    });
  }
};

// ================= CANCEL =================
exports.cancelSpaBooking = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id || req.user?.userId;
    const { id } = req.params;
    const { reason = "" } = req.body;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được người dùng đăng nhập",
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

    if (String(booking.customerId) !== String(customerId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy booking này",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy khi booking chưa được xác nhận",
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = String(reason || "").trim();
    booking.rejectedByStaffIds = [];

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Hủy booking thành công",
      data: booking,
    });
  } catch (e) {
    console.error("CANCEL SPA BOOKING ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi hủy booking",
    });
  }
};
