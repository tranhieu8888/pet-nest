const mongoose = require("mongoose");
const StaffSchedule = require("../models/staffScheduleModel");

function normalizeWorkDate(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function isValidTimeFormat(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
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

// Lấy danh sách lịch làm việc
exports.getAll = async (req, res) => {
  try {
    const page =
      parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const limit =
      parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 10;

    const skip = (page - 1) * limit;

    const total = await StaffSchedule.countDocuments();

    const schedules = await StaffSchedule.find()
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
    };

    const errorMessage = validatePayload(payload);
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
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

    const schedule = await StaffSchedule.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate("staffId", "name");

    if (!schedule) {
      return res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
    }

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

// Xoá lịch
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID lịch không hợp lệ" });
    }

    const schedule = await StaffSchedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: e.message || "Xoá lịch thất bại" });
  }
};
