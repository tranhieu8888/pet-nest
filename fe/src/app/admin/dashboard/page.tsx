"use client";

import { useEffect, useState } from "react";
import {
  Users,
  ShoppingCart,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { api } from "../../../../utils/axios";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface Summary {
  totalUsers: number;
  newUsersThisMonth: number;
  userChange: number;
  totalOrders: number;
  ordersThisMonth: number;
  ordersChange: number;
  pendingOrders: number;
  totalBookings: number;
  bookingsThisMonth: number;
  bookingsChange: number;
  pendingBookings: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueChange: number;
  totalRevenueSpa: number;
}

interface ChartPoint {
  month: string;
  total?: number;
  completed?: number;
  cancelled?: number;
  revenue?: number;
  users?: number;
}

interface RecentBooking {
  _id: string;
  bookingCode: string;
  customerSnapshot: { name: string };
  serviceSnapshot: { name: string; price: number };
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface DashboardData {
  summary: Summary;
  charts: {
    bookingsByMonth: ChartPoint[];
    revenueByMonth: ChartPoint[];
    usersByMonth: ChartPoint[];
  };
  recentBookings: RecentBooking[];
}

// ────────────────────────────────────────────────────────────────────────────
// Helper
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
export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setData(res.data.data);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Không thể tải dữ liệu dashboard
      </div>
    );
  }

  const { summary, charts, recentBookings } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tổng quan hoạt động hệ thống Pet Nest &amp; Grooming
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Người dùng"
          value={summary.totalUsers.toLocaleString("vi-VN")}
          sub={`+${summary.newUsersThisMonth} mới tháng này`}
          change={summary.userChange}
          icon={Users}
          color="bg-indigo-500"
        />
        <StatCard
          title="Đơn hàng TMĐT"
          value={summary.totalOrders.toLocaleString("vi-VN")}
          sub={`${summary.pendingOrders} đang chờ`}
          change={summary.ordersChange}
          icon={ShoppingCart}
          color="bg-orange-500"
        />
        <StatCard
          title="Booking Spa"
          value={summary.totalBookings.toLocaleString("vi-VN")}
          sub={`${summary.pendingBookings} chờ xác nhận`}
          change={summary.bookingsChange}
          icon={Calendar}
          color="bg-emerald-500"
        />
        <StatCard
          title="Doanh thu Spa tháng này"
          value={fmt(summary.revenueThisMonth)}
          sub={`Tổng: ${fmt(summary.totalRevenueSpa)}`}
          change={summary.revenueChange}
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Biểu đồ booking theo tháng */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Booking Spa theo tháng ({new Date().getFullYear()})
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.bookingsByMonth} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Tổng" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Hoàn tất" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancelled" name="Huỷ" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ doanh thu Spa */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Doanh thu Spa theo tháng (VNĐ)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={charts.revenueByMonth}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v.toString()
                }
              />
              <Tooltip
                formatter={(v: unknown) => [fmt(Number(v)), "Doanh thu"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#7c3aed"
                fill="url(#gradRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Người dùng mới theo tháng */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Người dùng mới theo tháng
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.usersByMonth}>
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="users"
                name="Người dùng"
                stroke="#6366f1"
                fill="url(#gradUsers)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking gần đây */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Booking Spa gần đây
          </h2>
          <div className="space-y-3">
            {recentBookings.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                Chưa có booking nào
              </p>
            )}
            {recentBookings.map((b) => (
              <div
                key={b._id}
                className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {b.customerSnapshot?.name || "—"}{" "}
                      <span className="text-gray-400 font-normal">
                        – {b.serviceSnapshot?.name || "—"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {b.bookingCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      statusColor[b.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusLabel[b.status] || b.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
