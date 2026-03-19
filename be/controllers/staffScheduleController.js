const StaffSchedule = require("../models/staffScheduleModel");

exports.getMySchedules = async (req, res) => {
  try {
    const staffId = req.user.id || req.user._id;

    if (!staffId) {
      return res.status(400).json({ message: "Không xác định được nhân viên" });
    }

    const schedules = await StaffSchedule.find({ staffId }).sort({
      workDate: 1,
    });

    res.json(schedules);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
