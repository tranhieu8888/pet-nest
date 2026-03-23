const User = require("../models/userModel");
const Order = require("../models/order");
const SpaBooking = require("../models/spaBookingModel");
const { ROLES } = require("../config/role");

const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

/**
 * Lấy dữ liệu thống kê tổng hợp cho Admin Dashboard
 */
exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // ── 1. Tổng người dùng và mới trong tháng ──────────────────────────
    const [totalUsers, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
      User.countDocuments({ role: { $ne: ROLES.ADMIN } }),
      User.countDocuments({ role: { $ne: ROLES.ADMIN }, createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ role: { $ne: ROLES.ADMIN }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    ]);

    // ── 2. Đơn hàng TMĐT ──────────────────────────────────────────────
    const [totalOrders, ordersThisMonth, ordersLastMonth, pendingOrders] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ createAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Order.countDocuments({ status: "pending" }),
    ]);

    // ── 3. Booking Spa ────────────────────────────────────────────────
    const [totalBookings, bookingsThisMonth, bookingsLastMonth, pendingBookings] = await Promise.all([
      SpaBooking.countDocuments({}),
      SpaBooking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      SpaBooking.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      SpaBooking.countDocuments({ status: "pending" }),
    ]);

    // ── 4. Doanh thu Spa (chỉ đơn completed + paid) ───────────────────
    const [revenueThisMonth, revenueLastMonth, totalRevenueSpa] = await Promise.all([
      SpaBooking.aggregate([
        { $match: { status: "completed", paymentStatus: "paid", updatedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$serviceSnapshot.price" } } },
      ]),
      SpaBooking.aggregate([
        { $match: { status: "completed", paymentStatus: "paid", updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: "$serviceSnapshot.price" } } },
      ]),
      SpaBooking.aggregate([
        { $match: { status: "completed", paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$serviceSnapshot.price" } } },
      ]),
    ]);

    // ── 5. Biểu đồ Booking Spa theo tháng trong năm (12 tháng) ────────
    const bookingsByMonth = await SpaBooking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const bookingChartData = MONTHS.map((month, i) => {
      const found = bookingsByMonth.find((b) => b._id === i + 1);
      return {
        month,
        total: found?.total || 0,
        completed: found?.completed || 0,
        cancelled: found?.cancelled || 0,
      };
    });

    // ── 6. Biểu đồ Doanh thu Spa theo tháng trong năm ─────────────────
    const revenueByMonth = await SpaBooking.aggregate([
      {
        $match: {
          status: "completed",
          paymentStatus: "paid",
          updatedAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$updatedAt" },
          revenue: { $sum: "$serviceSnapshot.price" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueChartData = MONTHS.map((month, i) => {
      const found = revenueByMonth.find((r) => r._id === i + 1);
      return {
        month,
        revenue: found?.revenue || 0,
      };
    });

    // ── 7. Người dùng đăng ký theo tháng trong năm ────────────────────
    const usersByMonth = await User.aggregate([
      {
        $match: {
          role: { $ne: ROLES.ADMIN },
          createdAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const userChartData = MONTHS.map((month, i) => {
      const found = usersByMonth.find((u) => u._id === i + 1);
      return {
        month,
        users: found?.count || 0,
      };
    });

    // ── 8. Booking mới nhất (5 cái) ───────────────────────────────────
    const recentBookings = await SpaBooking.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("bookingCode customerSnapshot serviceSnapshot status paymentStatus createdAt startAt")
      .lean();

    // ── Tính % thay đổi ───────────────────────────────────────────────
    const calcChange = (current, prev) => {
      if (!prev) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          newUsersThisMonth,
          userChange: calcChange(newUsersThisMonth, newUsersLastMonth),
          totalOrders,
          ordersThisMonth,
          ordersChange: calcChange(ordersThisMonth, ordersLastMonth),
          pendingOrders,
          totalBookings,
          bookingsThisMonth,
          bookingsChange: calcChange(bookingsThisMonth, bookingsLastMonth),
          pendingBookings,
          revenueThisMonth: revenueThisMonth[0]?.total || 0,
          revenueLastMonth: revenueLastMonth[0]?.total || 0,
          revenueChange: calcChange(revenueThisMonth[0]?.total || 0, revenueLastMonth[0]?.total || 0),
          totalRevenueSpa: totalRevenueSpa[0]?.total || 0,
        },
        charts: {
          bookingsByMonth: bookingChartData,
          revenueByMonth: revenueChartData,
          usersByMonth: userChartData,
        },
        recentBookings,
      },
    });
  } catch (e) {
    console.error("ADMIN DASHBOARD STATS ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy thống kê",
    });
  }
};
