"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api, useApi } from "../../../utils/axios";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
type PaymentStatus = "paid" | "unpaid";

type Booking = {
  _id: string;
  bookingCode: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  note?: string;
  cancellationReason?: string;
  petSnapshot?: {
    name?: string;
    type?: "dog" | "cat";
    breed?: string;
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
};

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
];

const PAGE_SIZE = 5;

const statusLabelMap: Record<BookingStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

function getStatusBadgeClass(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getPaymentBadgeClass(paymentStatus: PaymentStatus) {
  return paymentStatus === "paid"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700";
}

function formatDateTime(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

function BookingCard({
  booking,
  submittingId,
  onCancel,
}: {
  booking: Booking;
  submittingId: string | null;
  onCancel: (bookingId: string, reason: string) => Promise<void>;
}) {
  const isSubmitting = submittingId === booking._id;

  // Helper to get pet image url
  function getPetImageUrl(image?: string) {
    if (!image) return "/placeholder.svg";
    if (image.startsWith("http://") || image.startsWith("https://"))
      return image;
    return `http://localhost:5000${
      image.startsWith("/") ? image : `/${image}`
    }`;
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              {/* Pet image */}
              <img
                src={getPetImageUrl(booking.petSnapshot?.image)}
                alt={booking.petSnapshot?.name || "Thú cưng"}
                className="h-14 w-14 rounded-xl object-cover border bg-gray-100"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {booking.serviceSnapshot?.name || "Dịch vụ"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Mã booking: {booking.bookingCode}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                  booking.status
                )}`}
              >
                {statusLabelMap[booking.status]}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPaymentBadgeClass(
                  booking.paymentStatus
                )}`}
              >
                {booking.paymentStatus === "paid"
                  ? "Đã thanh toán"
                  : "Chưa thanh toán"}
              </span>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
            <p>
              <span className="font-medium">Thú cưng:</span>{" "}
              {booking.petSnapshot?.name || "-"}
              {booking.petSnapshot?.breed
                ? ` - ${booking.petSnapshot.breed}`
                : ""}
            </p>

            <p>
              <span className="font-medium">Thời gian:</span>{" "}
              {formatDateTime(booking.startAt)}
            </p>

            <p>
              <span className="font-medium">Thời lượng:</span>{" "}
              {booking.serviceSnapshot?.durationMinutes || 0} phút
            </p>

            {booking.serviceSnapshot?.price !== undefined && (
              <p>
                <span className="font-medium">Giá:</span>{" "}
                {booking.serviceSnapshot.price.toLocaleString("vi-VN")}đ
              </p>
            )}

            {booking.staffSnapshot?.name && (
              <p>
                <span className="font-medium">Nhân viên:</span>{" "}
                {booking.staffSnapshot.name}
              </p>
            )}
          </div>

          {booking.note ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <span className="font-medium">Ghi chú:</span> {booking.note}
            </div>
          ) : null}

          {booking.status === "cancelled" && booking.cancellationReason ? (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              <span className="font-medium">Lý do hủy:</span>{" "}
              {booking.cancellationReason}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:max-w-[260px] xl:justify-end">
          {booking.status === "pending" && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                const reason =
                  window.prompt("Nhập lý do hủy booking:", "") || "";
                onCancel(booking._id, reason);
              }}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Hủy booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MySpaBookingsPage() {
  const { request } = useApi();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const res = await request(() => api.get("/spa-bookings/my"));

      if (res?.success) {
        setBookings(res.data || []);
      } else {
        setBookings([]);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải booking spa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchKeyword]);

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      setSubmittingId(bookingId);

      const res = await request(() =>
        api.patch(`/spa-bookings/${bookingId}/cancel`, { reason })
      );

      if (res?.success) {
        toast.success("Hủy booking thành công");
        await fetchBookings();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Hủy booking thất bại");
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchStatus = statusFilter ? booking.status === statusFilter : true;

      const fields = [
        booking.bookingCode,
        booking.petSnapshot?.name,
        booking.petSnapshot?.breed,
        booking.serviceSnapshot?.name,
        booking.note,
        booking.cancellationReason,
      ];

      const matchKeyword = keyword
        ? fields.some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword)
          )
        : true;

      return matchStatus && matchKeyword;
    });
  }, [bookings, statusFilter, searchKeyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / PAGE_SIZE)
  );

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredBookings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredBookings, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    // Kết nối socket và lắng nghe notification
    const socket: Socket = io("http://localhost:5000");
    const token = sessionStorage.getItem("token");
    let userId = null;
    if (token) {
      const decoded = jwtDecode<{ id: string }>(token);
      userId = decoded.id;
    }
    if (userId) {
      socket.emit("join", userId);
    }
    socket.on("notification", (notification: any) => {
      if (notification?.type === "spa-booking") {
        fetchBookings();
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Lịch spa của tôi
              </h1>
              <p className="text-sm text-gray-500">
                Quản lý các booking spa cho thú cưng của bạn
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row lg:w-auto">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo mã booking, thú cưng, dịch vụ..."
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 md:min-w-[420px] lg:min-w-[520px] xl:min-w-[600px]"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500">
              Bạn chưa có booking spa nào
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedBookings.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    submittingId={submittingId}
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                  {Math.min(currentPage * PAGE_SIZE, filteredBookings.length)} /{" "}
                  {filteredBookings.length} booking
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trước
                  </button>

                  <span className="text-sm text-gray-600">
                    Trang {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
