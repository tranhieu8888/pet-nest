"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Truck,
  X,
  User,
  MapPin,
  ShoppingBag,
  Clock,
  CreditCard
} from "lucide-react";

import { api } from "../../../../utils/axios";

type OrderStatus = "processing" | "shipping" | "completed" | "cancelled";

type OrderItem = {
  _id: string;
  productId?: {
    _id: string;
    name: string;
  };
  productVariant?: {
    _id: string;
    images: { url: string }[];
    sellPrice: number;
    attribute: any[];
  };
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  OrderItems: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  createAt: string;
  updateAt: string;
  voucher?: any[];
};

type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
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

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "processing":
      return "Đang xử lý";
    case "shipping":
      return "Đang giao hàng";
    case "completed":
      return "Đã hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

function getStatusClass(status: OrderStatus) {
  switch (status) {
    case "processing":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "shipping":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

    if (searchKeyword) {
      params.set("search", searchKeyword);
    }
    
    if (statusFilter && statusFilter !== "All") {
      params.set("status", statusFilter);
    }

    return params.toString();
  }, [page, limit, searchKeyword, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/admin/orders?${queryString}`, {
        headers: getAuthHeaders(),
      });

      setOrders(res.data?.orders || []);
      setPagination({
        page: res.data?.currentPage || 1,
        limit,
        totalItems: res.data?.totalOrders || 0,
        totalPages: res.data?.totalPages || 1,
      });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setOrders([]);
      setError(
        error.response?.data?.message || "Không thể tải danh sách đơn hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await api.get(`/admin/orders/${id}`, {
        headers: getAuthHeaders(),
      });
      setSelectedOrder(res.data || null);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      alert(
        error.response?.data?.message || "Không thể tải chi tiết đơn hàng"
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const updateOrderStatus = async (id: string, newStatus: OrderStatus) => {
    if (!window.confirm("Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng này?")) return;
    
    try {
      setUpdatingStatus(true);
      await api.patch(
        `/admin/orders/${id}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      
      // Refresh details if modal is open
      if (selectedOrder && selectedOrder._id === id) {
        await fetchOrderDetail(id);
      }
      
      // Refresh list
      await fetchOrders();
      
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      alert(
        error.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [queryString]);

  const handleResetSearch = () => {
    setKeyword("");
    setSearchKeyword("");
    setStatusFilter("All");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý đơn hàng
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Theo dõi và cập nhật trạng thái đơn hàng.
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 px-4 py-2 text-sm">
              Tổng đơn:{" "}
              <span className="font-semibold">{pagination.totalItems}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <input
                value={keyword}
                onChange={(e: any) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên KH, email hoặc ID đơn hàng..."
                className="w-full rounded-xl border px-4 py-3 pr-11 outline-none transition focus:border-indigo-500"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <button
              type="button"
              onClick={handleResetSearch}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50 shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
              Đặt lại
            </button>
          </div>
          
          {/* Status Filter Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { value: "All", label: "Tất cả" },
              { value: "processing", label: "Đang xử lý" },
              { value: "shipping", label: "Đang giao hàng" },
              { value: "completed", label: "Đã hoàn thành" },
              { value: "cancelled", label: "Đã hủy" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value as any)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  statusFilter === tab.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Không có đơn hàng nào phù hợp.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1150px] w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-600">
                      <th className="px-5 py-4 font-semibold">Mã đơn / Ngày</th>
                      <th className="px-5 py-4 font-semibold">Khách hàng</th>
                      <th className="px-5 py-4 font-semibold">Sản phẩm</th>
                      <th className="px-5 py-4 font-semibold">Tổng tiền</th>
                      <th className="px-5 py-4 font-semibold">Trạng thái</th>
                      <th className="px-5 py-4 font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-t text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-5 align-top">
                          <div className="max-w-[220px] break-words font-semibold text-gray-900 line-clamp-1" title={order._id}>
                            #{order._id.substring(order._id.length - 8).toUpperCase()}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {formatDateTime(order.createAt)}
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="font-semibold text-gray-900">
                            {order.userId?.name || "Khách ẩn danh"}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {order.userId?.email || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="font-medium">
                            {order.OrderItems?.length || 0} sản phẩm
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="font-semibold text-indigo-600">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {order.paymentMethod || "COD"}
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <button
                            onClick={() => fetchOrderDetail(order._id)}
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
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
                  đơn hàng
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trước
                  </button>

                  <div className="rounded-xl border bg-gray-50 px-4 py-2 text-sm font-medium">
                    {pagination.page}
                  </div>

                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                    className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center py-6">
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b px-6 py-5 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Chi tiết đơn hàng
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    ID: {selectedOrder._id}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-2 transition hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Items */}
                      <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                          <ShoppingBag className="h-5 w-5 text-indigo-500" />
                          Sản phẩm ({selectedOrder.OrderItems?.length || 0})
                        </div>
                        <div className="space-y-4">
                          {selectedOrder.OrderItems?.map((item, idx) => (
                            <div key={idx} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                               <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-gray-50">
                                {item.productVariant?.images?.[0]?.url ? (
                                  <img 
                                    src={item.productVariant.images[0].url} 
                                    alt="Product" 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No Img</div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.productId?.name || "Sản phẩm không xác định"}</h4>
                                <div className="mt-1 flex justify-between text-sm">
                                  <span className="text-gray-500">
                                    {formatCurrency(item.price)} x {item.quantity}
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {formatCurrency(item.price * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment & Summary */}
                      <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                          <CreditCard className="h-5 w-5 text-indigo-500" />
                          Thanh toán
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Phương thức:</span>
                            <span className="font-medium">{selectedOrder.paymentMethod || "COD"}</span>
                          </div>
                          
                          {selectedOrder.voucher && selectedOrder.voucher.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Voucher áp dụng:</span>
                              <span className="font-medium text-green-600">{selectedOrder.voucher.length} voucher</span>
                            </div>
                          )}
                          
                          <div className="border-t pt-3 mt-3 flex justify-between text-base font-bold">
                            <span>Tổng cộng:</span>
                            <span className="text-indigo-600">{formatCurrency(selectedOrder.total)}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Right Column - Customer & Actions */}
                    <div className="space-y-6">
                      
                      {/* Status Update Actions */}
                      <div className="rounded-2xl border bg-indigo-50 p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 text-lg font-bold text-indigo-900">
                          <Truck className="h-5 w-5" />
                          Trạng thái đơn
                        </div>
                        
                        <div className="mb-5 inline-flex rounded-full border bg-white px-4 py-2 text-sm font-semibold shadow-sm">
                          {getStatusLabel(selectedOrder.status)}
                        </div>
                        
                        <div className="space-y-3">
                          {selectedOrder.status === "processing" && (
                            <>
                              <button
                                disabled={updatingStatus}
                                onClick={() => updateOrderStatus(selectedOrder._id, "shipping")}
                                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                              >
                                Xác nhận giao hàng
                              </button>
                              <button
                                disabled={updatingStatus}
                                onClick={() => updateOrderStatus(selectedOrder._id, "cancelled")}
                                className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                              >
                                Hủy đơn hàng
                              </button>
                            </>
                          )}

                          {selectedOrder.status === "shipping" && (
                            <>
                              <button
                                disabled={updatingStatus}
                                onClick={() => updateOrderStatus(selectedOrder._id, "completed")}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Đã giao thành công
                              </button>
                              <button
                                disabled={updatingStatus}
                                onClick={() => updateOrderStatus(selectedOrder._id, "cancelled")}
                                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Hủy đơn hàng
                              </button>
                            </>
                          )}

                          {(selectedOrder.status === "completed" || selectedOrder.status === "cancelled") && (
                            <div className="text-sm text-gray-500 italic text-center">
                              Không thể thay đổi trạng thái nữa
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                          <User className="h-5 w-5 text-indigo-500" />
                          Khách hàng
                        </div>
                        <div className="space-y-3 text-sm text-gray-700">
                          <p>
                            <span className="block text-gray-500 text-xs mb-1">Tên khách hàng</span>
                            <span className="font-medium">{selectedOrder.userId?.name || "-"}</span>
                          </p>
                          <p>
                            <span className="block text-gray-500 text-xs mb-1">Email</span>
                            {selectedOrder.userId?.email || "-"}
                          </p>
                          <p>
                            <span className="block text-gray-500 text-xs mb-1">Số điện thoại</span>
                            {selectedOrder.userId?.phone || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                          <MapPin className="h-5 w-5 text-indigo-500" />
                          Giao hàng
                        </div>
                        {selectedOrder.address ? (
                          <div className="space-y-1 text-sm text-gray-700">
                            <p className="font-medium">{selectedOrder.address.street}</p>
                            <p>{selectedOrder.address.city}{selectedOrder.address.state ? `, ${selectedOrder.address.state}` : ''}</p>
                            <p>{selectedOrder.address.postalCode} - {selectedOrder.address.country}</p>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Chưa có thông tin địa chỉ</div>
                        )}
                      </div>

                      {/* Timeline */}
                      <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                          <Clock className="h-5 w-5 text-indigo-500" />
                          Thời gian
                        </div>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="block text-xs text-gray-500 mb-0.5">Tạo lúc:</span>
                            <span className="font-medium text-gray-700">{formatDateTime(selectedOrder.createAt)}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500 mb-0.5">Cập nhật lúc:</span>
                            <span className="font-medium text-gray-700">{formatDateTime(selectedOrder.updateAt)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
