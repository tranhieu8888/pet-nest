const SpaBooking = require("../models/spaBookingModel");
const SpaService = require("../models/spaServiceModel");
const User = require("../models/userModel");
const Pet = require("../models/petModel");

function generateBookingCode() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SPA-${Date.now()}-${random}`;
}

exports.createSpaBooking = async (req, res) => {
  try {
    console.log("CREATE SPA BOOKING HIT");
    console.log("REQ.USER:", req.user);
    console.log("REQ.BODY:", req.body);

    const customerId = req.user?.id || req.user?._id;

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

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Thời gian bắt đầu không hợp lệ",
      });
    }

    const now = new Date();
    if (startDate < now) {
      return res.status(400).json({
        success: false,
        message: "Không thể đặt lịch trong quá khứ",
      });
    }

    const endDate = new Date(
      startDate.getTime() + service.durationMinutes * 60 * 1000
    );

    const booking = await SpaBooking.create({
      bookingCode: generateBookingCode(),
      customerId,
      petId,
      serviceId: service._id,

      customerSnapshot: {
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
      },

      petSnapshot: {
        name: pet.name,
        type: pet.type,
        breed: pet.breed || "",
        age: pet.age ?? null,
        weight: pet.weight ?? null,
        note: pet.note || "",
        allergies: pet.allergies || "",
        behaviorNote: pet.behaviorNote || "",
      },

      serviceSnapshot: {
        name: service.name,
        category: service.category,
        price: service.price,
        durationMinutes: service.durationMinutes,
      },

      startAt: startDate,
      endAt: endDate,
      note,
      status: "pending",
      paymentStatus: "unpaid",
    });

    return res.status(201).json({
      success: true,
      message: "Đặt lịch spa thành công",
      data: booking,
    });
  } catch (e) {
    console.error("CREATE SPA BOOKING ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi tạo booking spa",
    });
  }
};

exports.getMySpaBookings = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được người dùng đăng nhập",
      });
    }

    const bookings = await SpaBooking.find({ customerId })
      .populate("serviceId", "name slug image")
      .populate("petId", "name type breed")
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

exports.getSpaBookingById = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id;
    const { id } = req.params;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được người dùng đăng nhập",
      });
    }

    const booking = await SpaBooking.findById(id)
      .populate("serviceId", "name slug image")
      .populate("petId", "name type breed");

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

exports.cancelSpaBooking = async (req, res) => {
  try {
    const customerId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const { reason = "" } = req.body;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được người dùng đăng nhập",
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

    if (["completed", "cancelled", "in_progress"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking này không thể hủy",
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;

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
