const mongoose = require("mongoose");
const moment = require("moment-timezone");
const StaffSchedule = require("../models/staffScheduleModel");
const SpaBooking = require("../models/spaBookingModel");
const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

function normalizeWorkDate(dateInput) {
  if (!dateInput) return null;
  // Tạo moment object từ đầu ngày theo giờ VN, sau đó đưa về UTC để lưu DB đồng nhất
  // MongoDB Compass sẽ hiển thị là 00:00:00 +00:00 của ngày đó
  const m = moment.tz(dateInput, VN_TIMEZONE).startOf("day");
  if (!m.isValid()) return null;
  return m.toDate();
}

function getStartAndEndOfDay(dateInput) {
  const m = moment.tz(dateInput, VN_TIMEZONE);
  return { 
    start: m.clone().startOf("day").toDate(),
    end: m.clone().endOf("day").toDate()
  };
}

function isValidTimeFormat(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;

  const [hour, minute] = timeStr.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  return hour * 60 + minute;
}

function validatePayload(body) {
  const { staffId, workDate, shiftStart, shiftEnd, isOff } = body;

  if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
    return "Nhân viên không hợp lệ";
  }

  const normalizedDate = normalizeWorkDate(workDate);
  if (!normalizedDate) {
    return "Ngày làm không hợp lệ";
  }

  if (!isOff) {
    if (!shiftStart || !shiftEnd) {
      return "Vui lòng nhập giờ bắt đầu và giờ kết thúc";
    }

    if (!isValidTimeFormat(shiftStart) || !isValidTimeFormat(shiftEnd)) {
      return "Giờ làm việc không đúng định dạng HH:mm";
    }

    if (shiftStart >= shiftEnd) {
      return "Giờ bắt đầu phải nhỏ hơn giờ kết thúc";
    }
  }

  return null;
}

async function hasConfirmedBookingsOutsideNewShift({
  staffId,
  workDate,
  isOff,
  shiftStart,
  shiftEnd,
  excludeScheduleId = null,
}) {
  const { start, end } = getStartAndEndOfDay(workDate);

  const confirmedBookings = await SpaBooking.find({
    staffId,
    status: "confirmed",
    startAt: { $gte: start, $lte: end },
  }).select("_id startAt endAt bookingCode");

  if (!confirmedBookings.length) {
    return null;
  }

  if (isOff) {
    return {
      type: "off-day-conflict",
      booking: confirmedBookings[0],
    };
  }

  const newShiftStartMinutes = parseTimeToMinutes(shiftStart);
  const newShiftEndMinutes = parseTimeToMinutes(shiftEnd);

  for (const booking of confirmedBookings) {
    const bookingStartMinutes = moment.tz(booking.startAt, VN_TIMEZONE).hours() * 60 + 
                               moment.tz(booking.startAt, VN_TIMEZONE).minutes();
    const bookingEndMinutes = moment.tz(booking.endAt, VN_TIMEZONE).hours() * 60 + 
                             moment.tz(booking.endAt, VN_TIMEZONE).minutes();

    const isOutsideShift =
      bookingStartMinutes < newShiftStartMinutes ||
      bookingEndMinutes > newShiftEndMinutes;

    if (isOutsideShift) {
      return {
        type: "shift-conflict",
        booking,
      };
    }
  }

  return null;
}

// Lấy danh sách lịch làm việc
exports.getAll = async (req, res) => {
  try {
    const page =
      parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const limit =
      parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 10;

    const skip = (page - 1) * limit;

    const baseFilter = { isDeleted: false };

    const total = await StaffSchedule.countDocuments(baseFilter);

    const schedules = await StaffSchedule.find(baseFilter)
      .populate("staffId", "name")
      .sort({ workDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const data = schedules.map((s) => ({
      ...s.toObject(),
      staffName: s.staffId?.name || "",
    }));

    res.json({ data, total, page, limit });
  } catch (e) {
    res.status(500).json({ message: e.message || "Lỗi server" });
  }
};

// Tạo mới lịch
exports.create = async (req, res) => {
  try {
    const payload = {
      staffId: req.body.staffId,
      workDate: normalizeWorkDate(req.body.workDate),
      shiftStart: req.body.isOff ? "" : req.body.shiftStart,
      shiftEnd: req.body.isOff ? "" : req.body.shiftEnd,
      isOff: !!req.body.isOff,
      note: req.body.note || "",
      isDeleted: false,
      deletedAt: null,
    };

    const errorMessage = validatePayload(payload);
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const conflict = await hasConfirmedBookingsOutsideNewShift({
      staffId: payload.staffId,
      workDate: payload.workDate,
      isOff: payload.isOff,
      shiftStart: payload.shiftStart,
      shiftEnd: payload.shiftEnd,
    });

    if (conflict?.type === "off-day-conflict") {
      return res.status(400).json({
        message:
          "Không thể tạo ngày nghỉ vì nhân viên đã có booking được xác nhận trong ngày này",
      });
    }

    if (conflict?.type === "shift-conflict") {
      return res.status(400).json({
        message:
          "Không thể tạo ca làm này vì đã có booking được xác nhận nằm ngoài khung giờ làm việc",
      });
    }

    const schedule = await StaffSchedule.create(payload);

    const populated = await StaffSchedule.findById(schedule._id).populate(
      "staffId",
      "name"
    );

    res.status(201).json({
      ...populated.toObject(),
      staffName: populated.staffId?.name || "",
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({
        message: "Nhân viên này đã có lịch trong ngày đã chọn",
      });
    }

    res.status(400).json({ message: e.message || "Tạo lịch thất bại" });
  }
};

// Cập nhật lịch
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID lịch không hợp lệ" });
    }

    const payload = {
      staffId: req.body.staffId,
      workDate: normalizeWorkDate(req.body.workDate),
      shiftStart: req.body.isOff ? "" : req.body.shiftStart,
      shiftEnd: req.body.isOff ? "" : req.body.shiftEnd,
      isOff: !!req.body.isOff,
      note: req.body.note || "",
    };

    const errorMessage = validatePayload(payload);
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const schedule = await StaffSchedule.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!schedule) {
      return res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
    }

    const conflict = await hasConfirmedBookingsOutsideNewShift({
      staffId: payload.staffId,
      workDate: payload.workDate,
      isOff: payload.isOff,
      shiftStart: payload.shiftStart,
      shiftEnd: payload.shiftEnd,
      excludeScheduleId: id,
    });

    if (conflict?.type === "off-day-conflict") {
      return res.status(400).json({
        message:
          "Không thể chuyển sang nghỉ trong ngày vì nhân viên đã có booking được xác nhận trong ngày này",
      });
    }

    if (conflict?.type === "shift-conflict") {
      return res.status(400).json({
        message:
          "Không thể cập nhật ca làm vì đã có booking được xác nhận nằm ngoài khung giờ mới",
      });
    }

    schedule.staffId = payload.staffId;
    schedule.workDate = payload.workDate;
    schedule.shiftStart = payload.shiftStart;
    schedule.shiftEnd = payload.shiftEnd;
    schedule.isOff = payload.isOff;
    schedule.note = payload.note;

    await schedule.save();
    await schedule.populate("staffId", "name");

    res.json({
      ...schedule.toObject(),
      staffName: schedule.staffId?.name || "",
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({
        message: "Nhân viên này đã có lịch trong ngày đã chọn",
      });
    }

    res.status(400).json({ message: e.message || "Cập nhật lịch thất bại" });
  }
};

// Xoá mềm lịch
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID lịch không hợp lệ" });
    }

    const schedule = await StaffSchedule.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!schedule) {
      return res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
    }

    const { start, end } = getStartAndEndOfDay(schedule.workDate);

    const confirmedBooking = await SpaBooking.findOne({
      staffId: schedule.staffId,
      status: "confirmed",
      startAt: { $gte: start, $lte: end },
    }).select("_id bookingCode");

    if (confirmedBooking) {
      return res.status(400).json({
        message:
          "Không thể xoá lịch vì nhân viên đã có booking được xác nhận trong ngày này",
      });
    }

    schedule.isDeleted = true;
    schedule.deletedAt = new Date();

    await schedule.save();

    res.json({ success: true, message: "Đã xoá lịch thành công" });
  } catch (e) {
    res.status(400).json({ message: e.message || "Xoá lịch thất bại" });
  }
};
