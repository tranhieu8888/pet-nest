const SpaBooking = require("../models/spaBookingModel");
const StaffSchedule = require("../models/staffScheduleModel");
const moment = require("moment-timezone");

const VN_TZ = "Asia/Ho_Chi_Minh";

/**
 * Lấy thống kê cá nhân cho Staff Dashboard
 * GET /api/staff/dashboard/stats
 */
exports.getStaffDashboardStats = async (req, res) => {
  try {
    const staffId = req.user?.id || req.user?._id || req.user?.userId;

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được nhân viên",
      });
    }

    const nowVN = moment().tz(VN_TZ);
    const todayStart = nowVN.clone().startOf("day").toDate();
    const todayEnd = nowVN.clone().endOf("day").toDate();
    const monthStart = nowVN.clone().startOf("month").toDate();
    const monthEnd = nowVN.clone().endOf("month").toDate();
    const lastMonthStart = nowVN.clone().subtract(1, "month").startOf("month").toDate();
    const lastMonthEnd = nowVN.clone().subtract(1, "month").endOf("month").toDate();
    const yearStart = nowVN.clone().startOf("year").toDate();

    // ── 1. Thống kê đơn hôm nay ──────────────────────────────────────
    const [todayBookings, todayCompleted, todayPending] = await Promise.all([
      SpaBooking.countDocuments({ staffId, startAt: { $gte: todayStart, $lte: todayEnd } }),
      SpaBooking.countDocuments({ staffId, status: "completed", startAt: { $gte: todayStart, $lte: todayEnd } }),
      SpaBooking.countDocuments({ staffId, status: { $in: ["pending", "confirmed"] }, startAt: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    // ── 2. Thống kê tháng này ─────────────────────────────────────────
    const [monthBookings, monthCompleted, lastMonthCompleted] = await Promise.all([
      SpaBooking.countDocuments({ staffId, createdAt: { $gte: monthStart, $lte: monthEnd } }),
      SpaBooking.countDocuments({ staffId, status: "completed", updatedAt: { $gte: monthStart, $lte: monthEnd } }),
      SpaBooking.countDocuments({ staffId, status: "completed", updatedAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
    ]);

    // ── 3. Doanh thu thu hộ tháng này (completed + paid) ──────────────
    const [revenueThisMonth, revenueLastMonth] = await Promise.all([
      SpaBooking.aggregate([
        { $match: { staffId: require("mongoose").Types.ObjectId.createFromHexString(String(staffId)), status: "completed", paymentStatus: "paid", updatedAt: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: "$serviceSnapshot.price" } } },
      ]),
      SpaBooking.aggregate([
        { $match: { staffId: require("mongoose").Types.ObjectId.createFromHexString(String(staffId)), status: "completed", paymentStatus: "paid", updatedAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$serviceSnapshot.price" } } },
      ]),
    ]);

    // ── 4. Tổng số đơn đã hoàn tất từ trước đến nay ────────────────────
    const totalCompleted = await SpaBooking.countDocuments({ staffId, status: "completed" });
    const totalAll = await SpaBooking.countDocuments({ staffId });
    const completionRate = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;

    // ── 5. Biểu đồ đơn hoàn tất theo ngày trong tuần (7 ngày qua) ─────
    const sevenDaysAgo = nowVN.clone().subtract(6, "days").startOf("day").toDate();
    const weeklyData = await SpaBooking.aggregate([
      {
        $match: {
          staffId: require("mongoose").Types.ObjectId.createFromHexString(String(staffId)),
          status: "completed",
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$updatedAt",
              timezone: VN_TZ,
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Tạo mảng 7 ngày đầy đủ
    const weeklyChart = [];
    for (let i = 6; i >= 0; i--) {
      const day = nowVN.clone().subtract(i, "days");
      const key = day.format("YYYY-MM-DD");
      const label = day.format("DD/MM");
      const found = weeklyData.find((d) => d._id === key);
      weeklyChart.push({ day: label, completed: found?.count || 0 });
    }

    // ── 6. Biểu đồ đơn theo tháng trong năm (12 tháng) ───────────────
    const monthlyData = await SpaBooking.aggregate([
      {
        $match: {
          staffId: require("mongoose").Types.ObjectId.createFromHexString(String(staffId)),
          status: "completed",
          updatedAt: { $gte: yearStart },
        },
      },
      {
        $group: {
          _id: { $month: { date: "$updatedAt", timezone: VN_TZ } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
    const monthlyChart = MONTHS.map((m, i) => {
      const found = monthlyData.find((d) => d._id === i + 1);
      return { month: m, completed: found?.count || 0 };
    });

    // ── 7. Lịch làm việc hôm nay ───────────────────────────────────────
    const todayWorkDate = nowVN.clone().startOf("day").subtract(7, "hours").toDate();
    const tomorrowWorkDate = nowVN.clone().startOf("day").subtract(7, "hours").add(1, "day").toDate();

    const todaySchedule = await StaffSchedule.findOne({
      staffId,
      isDeleted: false,
      workDate: { $gte: todayWorkDate, $lt: tomorrowWorkDate },
    });

    // ── 8. Danh sách booking hôm nay của staff này ─────────────────────
    const todayBookingList = await SpaBooking.find({
      staffId,
      startAt: { $gte: todayStart, $lte: todayEnd },
    })
      .sort({ startAt: 1 })
      .select("bookingCode customerSnapshot serviceSnapshot petSnapshot status paymentStatus startAt endAt")
      .lean();

    // ── Tính % thay đổi ───────────────────────────────────────────────
    const calcChange = (curr, prev) => {
      if (!prev) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          todayBookings,
          todayCompleted,
          todayPending,
          monthBookings,
          monthCompleted,
          monthChange: calcChange(monthCompleted, lastMonthCompleted),
          revenueThisMonth: revenueThisMonth[0]?.total || 0,
          revenueLastMonth: revenueLastMonth[0]?.total || 0,
          revenueChange: calcChange(revenueThisMonth[0]?.total || 0, revenueLastMonth[0]?.total || 0),
          totalCompleted,
          completionRate,
        },
        todaySchedule: todaySchedule
          ? {
              shiftStart: todaySchedule.shiftStart,
              shiftEnd: todaySchedule.shiftEnd,
              isOff: todaySchedule.isOff,
              note: todaySchedule.note,
            }
          : null,
        todayBookings: todayBookingList,
        charts: {
          weekly: weeklyChart,
          monthly: monthlyChart,
        },
      },
    });
  } catch (e) {
    console.error("STAFF DASHBOARD STATS ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy thống kê",
    });
  }
};
