"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  TrendingUp,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from "lucide-react";
import { api } from "../../../../utils/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface Summary {
  todayBookings: number;
  todayCompleted: number;
  todayPending: number;
  monthBookings: number;
  monthCompleted: number;
  monthChange: number;
  revenueThisMonth: number;
  revenueChange: number;
  totalCompleted: number;
  completionRate: number;
}

interface TodaySchedule {
  shiftStart: string;
  shiftEnd: string;
  isOff: boolean;
  note: string;
}

interface TodayBooking {
  _id: string;
  bookingCode: string;
  customerSnapshot: { name: string };
  serviceSnapshot: { name: string; price: number };
  petSnapshot: { name: string };
  status: string;
  paymentStatus: string;
  startAt: string;
}

interface ChartPoint {
  day?: string;
  month?: string;
  completed: number;
}

interface DashboardData {
  summary: Summary;
  todaySchedule: TodaySchedule | null;
  todayBookings: TodayBooking[];
  charts: {
    weekly: ChartPoint[];
    monthly: ChartPoint[];
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabel: Record<string, string> = {
  pending: "Chờ",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Huỷ",
};

// ────────────────────────────────────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  sub,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  sub?: string;
  change?: number;
  icon: React.ElementType;
  color: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-1 ${
              isPositive ? "text-green-600" : "text-red-500"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(change ?? 0)}% so với tháng trước
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────
export default function StaffDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState<string>("");

  useEffect(() => {
    // Lấy tên nhân viên từ token
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setStaffName(decoded.name || "Nhân viên");
      }
    } catch {}

    const fetchStats = async () => {
      try {
        const res = await api.get("/staff/dashboard/stats");
        setData(res.data.data);
      } catch (e) {
        console.error("Staff dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Không thể tải dữ liệu
      </div>
    );
  }

  const { summary, todaySchedule, todayBookings, charts } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <p className="text-emerald-100 text-sm capitalize">{dateStr}</p>
        <h1 className="text-2xl font-bold mt-1">Xin chào, {staffName} 👋</h1>
        <p className="text-emerald-100 text-sm mt-1">
          {summary.todayPending > 0
            ? `Bạn có ${summary.todayPending} đơn đang chờ xử lý hôm nay.`
            : "Không có đơn nào đang chờ hôm nay. Tuyệt vời! 🎉"}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Đơn hôm nay"
          value={summary.todayBookings}
          sub={`${summary.todayCompleted} hoàn tất · ${summary.todayPending} chờ`}
          icon={CalendarCheck}
          color="bg-emerald-500"
        />
        <StatCard
          title="Hoàn tất tháng này"
          value={summary.monthCompleted}
          sub={`Tổng ${summary.monthBookings} đơn được giao`}
          change={summary.monthChange}
          icon={CheckCircle}
          color="bg-blue-500"
        />
        <StatCard
          title="Tỷ lệ hoàn tất"
          value={`${summary.completionRate}%`}
          sub={`${summary.totalCompleted} đơn hoàn tất từ trước đến nay`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Doanh thu tháng này"
          value={fmt(summary.revenueThisMonth)}
          change={summary.revenueChange}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      {/* Lịch hôm nay + Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lịch làm việc hôm nay */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            Lịch làm việc hôm nay
          </h2>

          {!todaySchedule ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 gap-2">
              <AlertCircle className="w-8 h-8 text-gray-300" />
              <p className="text-sm">Hôm nay chưa có lịch làm việc</p>
            </div>
          ) : todaySchedule.isOff ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <span className="text-3xl">🏖</span>
              <p className="text-sm font-medium text-orange-600">Ngày nghỉ</p>
              {todaySchedule.note && (
                <p className="text-xs text-gray-400">{todaySchedule.note}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">
                  Ca làm việc
                </p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {todaySchedule.shiftStart} – {todaySchedule.shiftEnd}
                </p>
              </div>
              {todaySchedule.note && (
                <p className="text-xs text-gray-500 text-center">
                  📝 {todaySchedule.note}
                </p>
              )}
              <div className="text-center">
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                  <CalendarCheck className="w-3 h-3" />
                  {summary.todayBookings} đơn hôm nay
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Biểu đồ 7 ngày gần nhất */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-4">
            Đơn hoàn tất – 7 ngày gần nhất
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.weekly} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="completed"
                name="Hoàn tất"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Danh sách booking hôm nay */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-emerald-500" />
          Đơn dịch vụ hôm nay ({todayBookings.length})
        </h2>

        {todayBookings.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">Không có đơn nào hôm nay</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Giờ</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Khách hàng</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Dịch vụ</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Thú cưng</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Trạng thái</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Giá</th>
                </tr>
              </thead>
              <tbody>
                {todayBookings.map((b) => (
                  <tr
                    key={b._id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono text-xs text-gray-600">
                      {new Date(b.startAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-800">
                      {b.customerSnapshot?.name || "—"}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {b.serviceSnapshot?.name || "—"}
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {b.petSnapshot?.name || "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          statusColor[b.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {statusLabel[b.status] || b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-emerald-700">
                      {fmt(b.serviceSnapshot?.price || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Biểu đồ 12 tháng */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4">
          Hiệu suất theo tháng ({new Date().getFullYear()})
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={charts.monthly} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="completed"
              name="Đơn hoàn tất"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
