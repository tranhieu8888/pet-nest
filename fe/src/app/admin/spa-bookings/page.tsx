"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  Search,
  RefreshCw,
  Eye,
  CalendarDays,
  User,
  PawPrint,
  Scissors,
  CreditCard,
  X,
} from "lucide-react";

import { api } from "../../../../utils/axios";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "paid";

type SpaBooking = {
  _id: string;
  bookingCode: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  note?: string;
  internalNote?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;

  customerSnapshot?: {
    name?: string;
    phone?: string;
    email?: string;
  };

  petSnapshot?: {
    name?: string;
    type?: "dog" | "cat";
    breed?: string;
    age?: number | null;
    weight?: number | null;
    note?: string;
    allergies?: string;
    behaviorNote?: string;
    image?: string;
  };

  serviceSnapshot?: {
    name?: string;
    category?: string;
    price?: number;
    durationMinutes?: number;
  };

  staffSnapshot?: {
    name?: string;
    phone?: string;
  };

  customerId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: number;
  } | null;

  petId?: {
    _id?: string;
    name?: string;
    type?: "dog" | "cat";
    breed?: string;
    image?: string;
  } | null;

  serviceId?: {
    _id?: string;
    name?: string;
    slug?: string;
    image?: string;
    category?: string;
    price?: number;
    durationMinutes?: number;
    description?: string;
  } | null;

  staffId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: number;
  } | null;
};

type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function formatDateTime(date?: string) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "-";
  return `${value.toLocaleString("vi-VN")}đ`;
}

function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

function getPaymentLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Đã thanh toán";
    case "unpaid":
      return "Chưa thanh toán";
    default:
      return status;
  }
}

function getStatusClass(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "confirmed":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getPaymentClass(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700 border-green-200";
    case "unpaid":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function AdminSpaBookingsPage() {
  const [bookings, setBookings] = useState<SpaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [selectedBooking, setSelectedBooking] = useState<SpaBooking | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchKeyword(keyword.trim());
    }, 800);

    return () => clearTimeout(timer);
  }, [keyword]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sortBy", "createdAt");
    params.set("sortOrder", "desc");

    if (searchKeyword) {
      params.set("keyword", searchKeyword);
    }

    return params.toString();
  }, [page, limit, searchKeyword]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/admin/spa-bookings?${queryString}`, {
        headers: getAuthHeaders(),
      });

      setBookings(Array.isArray(res.data?.data) ? res.data.data : []);
      setPagination(
        res.data?.pagination || {
          page: 1,
          limit,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setBookings([]);
      setError(
        error.response?.data?.message || "Không thể tải danh sách spa booking"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await api.get(`/admin/spa-bookings/${id}`, {
        headers: getAuthHeaders(),
      });
      setSelectedBooking(res.data?.data || null);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      alert(
        error.response?.data?.message || "Không thể tải chi tiết spa booking"
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [queryString]);

  const handleResetSearch = () => {
    setKeyword("");
    setSearchKeyword("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý spa booking
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Tìm kiếm và theo dõi danh sách lịch spa.
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 px-4 py-2 text-sm">
              Tổng booking:{" "}
              <span className="font-semibold">{pagination.totalItems}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo mã booking, khách hàng, thú cưng, dịch vụ..."
                className="w-full rounded-xl border px-4 py-3 pr-11 outline-none transition focus:border-primary"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <button
              type="button"
              onClick={handleResetSearch}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Đặt lại
            </button>
          </div>

        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Không có spa booking nào phù hợp.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1150px] w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-600">
                      <th className="px-5 py-4 font-semibold">Mã booking</th>
                      <th className="px-5 py-4 font-semibold">Khách hàng</th>
                      <th className="px-5 py-4 font-semibold">Thú cưng</th>
                      <th className="px-5 py-4 font-semibold">Dịch vụ</th>
                      <th className="px-5 py-4 font-semibold">Lịch hẹn</th>
                      <th className="px-5 py-4 font-semibold">Trạng thái</th>
                      <th className="px-5 py-4 font-semibold">Thanh toán</th>
                      <th className="px-5 py-4 font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="border-t text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-5 align-top">
                          <div className="max-w-[220px] break-words font-semibold text-gray-900">
                            {booking.bookingCode}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Tạo lúc: {formatDateTime(booking.createdAt)}
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="font-semibold">
                            {booking.customerSnapshot?.name ||
                              booking.customerId?.name ||
                              "-"}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {booking.customerSnapshot?.phone ||
                              booking.customerId?.phone ||
                              "-"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.customerSnapshot?.email ||
                              booking.customerId?.email ||
                              "-"}
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="font-semibold">
                            {booking.petSnapshot?.name ||
                              booking.petId?.name ||
                              "-"}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {(booking.petSnapshot?.type ||
                              booking.petId?.type ||
                              "-") + " • "}
                            {booking.petSnapshot?.breed ||
                              booking.petId?.breed ||
                              "-"}
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="font-semibold">
                            {booking.serviceSnapshot?.name ||
                              booking.serviceId?.name ||
                              "-"}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {(booking.serviceSnapshot?.category ||
                              booking.serviceId?.category ||
                              "-") + " • "}
                            {formatCurrency(
                              booking.serviceSnapshot?.price ??
                                booking.serviceId?.price
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="font-semibold">
                            {formatDateTime(booking.startAt)}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Kết thúc: {formatDateTime(booking.endAt)}
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusClass(
                              booking.status
                            )}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${getPaymentClass(
                              booking.paymentStatus
                            )}`}
                          >
                            {getPaymentLabel(booking.paymentStatus)}
                          </span>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <button
                            onClick={() => fetchBookingDetail(booking._id)}
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4" />
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-500">
                  Trang <span className="font-semibold">{pagination.page}</span>{" "}
                  /{" "}
                  <span className="font-semibold">
                    {pagination.totalPages || 1}
                  </span>{" "}
                  • Tổng{" "}
                  <span className="font-semibold">{pagination.totalItems}</span>{" "}
                  booking
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trước
                  </button>

                  <div className="rounded-xl border bg-gray-50 px-4 py-2.5 text-sm font-medium">
                    {pagination.page}
                  </div>

                  <button
                    disabled={!pagination.hasNextPage}
                    onClick={() =>
                      setPage((prev) =>
                        pagination.totalPages > 0
                          ? Math.min(prev + 1, pagination.totalPages)
                          : prev + 1
                      )
                    }
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Chi tiết spa booking
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedBooking.bookingCode}
                </p>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-2 transition hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center p-10">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              </div>
            ) : (
              <div className="max-h-[75vh] overflow-y-auto p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <User className="h-5 w-5" />
                      Khách hàng
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Tên:</span>{" "}
                        {selectedBooking.customerSnapshot?.name ||
                          selectedBooking.customerId?.name ||
                          "-"}
                      </p>
                      <p>
                        <span className="font-medium">SĐT:</span>{" "}
                        {selectedBooking.customerSnapshot?.phone ||
                          selectedBooking.customerId?.phone ||
                          "-"}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedBooking.customerSnapshot?.email ||
                          selectedBooking.customerId?.email ||
                          "-"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <PawPrint className="h-5 w-5" />
                      Thú cưng
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Tên:</span>{" "}
                        {selectedBooking.petSnapshot?.name ||
                          selectedBooking.petId?.name ||
                          "-"}
                      </p>
                      <p>
                        <span className="font-medium">Loại:</span>{" "}
                        {selectedBooking.petSnapshot?.type ||
                          selectedBooking.petId?.type ||
                          "-"}
                      </p>
                      <p>
                        <span className="font-medium">Giống:</span>{" "}
                        {selectedBooking.petSnapshot?.breed ||
                          selectedBooking.petId?.breed ||
                          "-"}
                      </p>
                      <p>
                        <span className="font-medium">Tuổi:</span>{" "}
                        {selectedBooking.petSnapshot?.age ?? "-"}
                      </p>
                      <p>
                        <span className="font-medium">Cân nặng:</span>{" "}
                        {selectedBooking.petSnapshot?.weight ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <Scissors className="h-5 w-5" />
                      Dịch vụ
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Tên:</span>{" "}
                        {selectedBooking.serviceSnapshot?.name ||
                          selectedBooking.serviceId?.name ||
                          "-"}
                      </p>
                      <p>
                        <span className="font-medium">Danh mục:</span>{" "}
                        {selectedBooking.serviceSnapshot?.category ||
                          selectedBooking.serviceId?.category ||
                          "-"}
                      </p>
                      <p>
                        <span className="font-medium">Giá:</span>{" "}
                        {formatCurrency(
                          selectedBooking.serviceSnapshot?.price ??
                            selectedBooking.serviceId?.price
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Thời lượng:</span>{" "}
                        {selectedBooking.serviceSnapshot?.durationMinutes ??
                          selectedBooking.serviceId?.durationMinutes ??
                          "-"}{" "}
                        phút
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <CalendarDays className="h-5 w-5" />
                      Lịch hẹn
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Bắt đầu:</span>{" "}
                        {formatDateTime(selectedBooking.startAt)}
                      </p>
                      <p>
                        <span className="font-medium">Kết thúc:</span>{" "}
                        {formatDateTime(selectedBooking.endAt)}
                      </p>
                      <p>
                        <span className="font-medium">Trạng thái:</span>{" "}
                        {getStatusLabel(selectedBooking.status)}
                      </p>
                      <p>
                        <span className="font-medium">Thanh toán:</span>{" "}
                        {getPaymentLabel(selectedBooking.paymentStatus)}
                      </p>
                      <p>
                        <span className="font-medium">Nhân viên:</span>{" "}
                        {selectedBooking.staffSnapshot?.name ||
                          selectedBooking.staffId?.name ||
                          "Chưa gán"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 md:col-span-2">
                    <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <CreditCard className="h-5 w-5" />
                      Ghi chú
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium">Ghi chú khách hàng</p>
                        <p className="mt-1 text-gray-700">
                          {selectedBooking.note || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">Ghi chú nội bộ</p>
                        <p className="mt-1 text-gray-700">
                          {selectedBooking.internalNote || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">Lý do hủy</p>
                        <p className="mt-1 text-gray-700">
                          {selectedBooking.cancellationReason || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">Dị ứng / hành vi</p>
                        <p className="mt-1 text-gray-700">
                          Dị ứng:{" "}
                          {selectedBooking.petSnapshot?.allergies || "-"}
                        </p>
                        <p className="text-gray-700">
                          Hành vi:{" "}
                          {selectedBooking.petSnapshot?.behaviorNote || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 md:col-span-2">
                    <div className="mb-3 text-lg font-semibold">
                      Thời gian hệ thống
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="font-medium">Tạo lúc</p>
                        <p className="mt-1 text-gray-700">
                          {formatDateTime(selectedBooking.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="font-medium">Cập nhật lúc</p>
                        <p className="mt-1 text-gray-700">
                          {formatDateTime(selectedBooking.updatedAt)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="font-medium">Đã hủy lúc</p>
                        <p className="mt-1 text-gray-700">
                          {formatDateTime(selectedBooking.cancelledAt || "")}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="font-medium">Mã booking</p>
                        <p className="mt-1 break-words text-gray-700">
                          {selectedBooking.bookingCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
