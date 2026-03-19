const mongoose = require("mongoose");
const SpaBooking = require("../models/spaBookingModel");

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ================= ADMIN LIST WITH SEARCH + PAGINATION =================
exports.getAdminSpaBookings = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      keyword = "",
      status = "",
      paymentStatus = "",
      dateFrom = "",
      dateTo = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const filter = {};

    // keyword search
    if (String(keyword).trim()) {
      const regex = new RegExp(escapeRegex(String(keyword).trim()), "i");

      filter.$or = [
        { bookingCode: regex },

        { "customerSnapshot.name": regex },
        { "customerSnapshot.phone": regex },
        { "customerSnapshot.email": regex },

        { "petSnapshot.name": regex },
        { "petSnapshot.breed": regex },

        { "serviceSnapshot.name": regex },
        { "serviceSnapshot.category": regex },

        { "staffSnapshot.name": regex },
        { "staffSnapshot.phone": regex },

        { note: regex },
        { internalNote: regex },
        { cancellationReason: regex },
      ];
    }

    // filter status
    if (String(status).trim()) {
      filter.status = String(status).trim();
    }

    // filter payment status
    if (String(paymentStatus).trim()) {
      filter.paymentStatus = String(paymentStatus).trim();
    }

    // filter date range by startAt
    if (dateFrom || dateTo) {
      filter.startAt = {};

      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!Number.isNaN(from.getTime())) {
          from.setHours(0, 0, 0, 0);
          filter.startAt.$gte = from;
        }
      }

      if (dateTo) {
        const to = new Date(dateTo);
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          filter.startAt.$lte = to;
        }
      }

      if (Object.keys(filter.startAt).length === 0) {
        delete filter.startAt;
      }
    }

    const allowedSortFields = [
      "createdAt",
      "startAt",
      "endAt",
      "status",
      "paymentStatus",
      "bookingCode",
    ];

    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const finalSortOrder = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [bookings, totalItems] = await Promise.all([
      SpaBooking.find(filter)
        .populate("customerId", "name email phone")
        .populate("petId", "name type breed image")
        .populate("serviceId", "name slug image category price durationMinutes")
        .populate("staffId", "name email phone")
        .sort({ [finalSortBy]: finalSortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),

      SpaBooking.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách spa booking thành công",
      data: bookings,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        keyword,
        status,
        paymentStatus,
        dateFrom,
        dateTo,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder === 1 ? "asc" : "desc",
      },
    });
  } catch (e) {
    console.error("ADMIN GET SPA BOOKINGS ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy danh sách spa booking",
    });
  }
};

// ================= ADMIN DETAIL =================
exports.getAdminSpaBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID booking không hợp lệ",
      });
    }

    const booking = await SpaBooking.findById(id)
      .populate("customerId", "name email phone role")
      .populate(
        "petId",
        "name type breed age weight note allergies behaviorNote image"
      )
      .populate(
        "serviceId",
        "name slug image category price durationMinutes description"
      )
      .populate("staffId", "name email phone role");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy spa booking",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (e) {
    console.error("ADMIN GET SPA BOOKING DETAIL ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy chi tiết spa booking",
    });
  }
};
