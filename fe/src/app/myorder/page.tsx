"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api, useApi } from "../../../utils/axios";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { useLanguage } from "@/context/LanguageContext";
import pagesConfigEn from "../../../utils/petPagesConfig.en.js";
import pagesConfigVi from "../../../utils/petPagesConfig.vi.js";
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  RotateCcw,
  ChevronRight,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface OrderItem {
  _id: string;
  productName: string;
  quantity: number;
  price: number;
  images: string[];
  attributes: string[];
}

interface Order {
  _id: string;
  total: number;
  finalTotal: number;
  voucherDiscount: number;
  status: "pending" | "processing" | "shipping" | "completed" | "cancelled" | "returned";
  paymentMethod: string;
  createAt: string;
  items: OrderItem[];
  reasonRejectCancel?: string;
}

const PAGE_SIZE = 5;

export default function MyOrdersPage() {
  const { lang } = useLanguage();
  const config = (lang === "vi" ? pagesConfigVi : pagesConfigEn).orderHistory;
  const { request } = useApi();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await request(() => api.get("/users/orders"));
      if (res?.success) {
        setOrders(res.data || []);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Socket implementation for real-time status updates
    const socket: Socket = io("http://localhost:5000");
    const token = sessionStorage.getItem("token");
    let userId = null;
    if (token) {
      try {
        const decoded = jwtDecode<{ id: string }>(token);
        userId = decoded.id;
      } catch (err) {}
    }
    if (userId) {
      socket.emit("join", userId);
    }
    
    socket.on("notification", (notification: any) => {
      if (notification?.type === "order-update" || notification?.type === "order") {
        fetchOrders();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchKeyword]);

  const filteredOrders = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    
    return orders.filter((order) => {
      const matchStatus = statusFilter === "all" ? true : order.status === statusFilter;
      
      const matchKeyword = keyword
        ? order._id.toLowerCase().includes(keyword) ||
          order.items?.some(item => item.productName.toLowerCase().includes(keyword))
        : true;
        
      return matchStatus && matchKeyword;
    });
  }, [orders, statusFilter, searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(price)) + "₫";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getImageUrl = (image: any) => {
    if (!image) return "/placeholder.svg";
    
    // Nếu image là object { url: ... }
    const url = typeof image === "string" ? image : image.url;
    
    if (!url) return "/placeholder.svg";
    
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    
    // Nếu là đường dẫn cục bộ (ví dụ từ public folder)
    if (url.startsWith("/")) {
      return url;
    }

    // Mặc định prepand address server
    return `http://localhost:5000/${url.startsWith("/") ? url.slice(1) : url}`;
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "processing": return <Package className="w-4 h-4" />;
      case "shipping": return <Truck className="w-4 h-4" />;
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      case "returned": return <RotateCcw className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-amber-50 text-amber-600 border-amber-200";
      case "processing": return "bg-blue-50 text-blue-600 border-blue-200";
      case "shipping": return "bg-indigo-50 text-indigo-600 border-indigo-200";
      case "completed": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "cancelled": return "bg-red-50 text-red-600 border-red-200";
      case "returned": return "bg-orange-50 text-orange-600 border-orange-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    // Ưu tiên mapping chuẩn từ schema
    const map: Record<string, string> = {
      processing: config.status.processing,
      shipping: config.status.shipping,
      completed: config.status.completed,
      cancelled: config.status.cancelled,
      pending: config.status.pending,
      returned: config.status.returned
    };
    return map[status] || status;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50/50 pb-20">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                {config.title}
              </h1>
              <p className="text-gray-500 font-medium">
                {config.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={config.searchPlaceholder}
                  className="pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white w-full sm:w-[320px] lg:w-[400px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium text-gray-700"
              >
                <option value="all">{config.allStatus}</option>
                {Object.entries(config.status).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">{config.loading}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{config.noOrders}</h3>
                <Link 
                  href="/homepage" 
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all"
                >
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {paginatedOrders.map((order) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Order ID
                              </span>
                              <span className="text-sm font-mono font-bold text-gray-900 group-hover:text-primary transition-colors">
                                #{order._id.slice(-8).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {formatDate(order.createAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </div>
                          
                          <Link 
                            href={`/order-success?orderId=${order._id}`}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                            title="Xem chi tiết"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-50">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="p-6 flex gap-5 items-center">
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                              <img
                                src={getImageUrl(item.images?.[0])}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                                {item.productName}
                              </h4>
                              {item.attributes && item.attributes.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  {item.attributes.map((attr, aIdx) => (
                                    <span key={aIdx} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg">
                                      {attr}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-sm text-gray-500 font-medium">
                                  {config.item.quantity.replace("{count}", item.quantity.toString())}
                                </span>
                                <span className="font-bold text-gray-900">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col gap-2">
                          <div className="text-sm text-gray-500 font-medium">
                            Phương thức thanh toán: 
                            <span className="ml-2 text-gray-900 font-bold uppercase tracking-tight">
                              {order.paymentMethod === "payos" ? "PayOS" : "COD"}
                            </span>
                          </div>
                          {order.reasonRejectCancel && (
                            <div className="text-xs text-red-500 font-bold italic">
                              * Lý do: {order.reasonRejectCancel}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
                            Tổng tiền
                          </p>
                          <div className="flex flex-col items-end">
                            {order.finalTotal < order.total && (
                              <span className="text-xs text-gray-400 line-through mb-1">
                                {formatPrice(order.total)}
                              </span>
                            )}
                            <span className="text-2xl font-black text-primary">
                              {formatPrice(order.finalTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">
                      {config.pagination.showing
                        .replace("{start}", ((currentPage - 1) * PAGE_SIZE + 1).toString())
                        .replace("{end}", Math.min(currentPage * PAGE_SIZE, filteredOrders.length).toString())
                        .replace("{total}", filteredOrders.length.toString())}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {config.pagination.previous}
                      </button>
                      
                      <div className="flex items-center gap-1.5 mx-2">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                              currentPage === i + 1 
                                ? "bg-primary text-white shadow-lg shadow-primary/25 scale-110" 
                                : "text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-100"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {config.pagination.next}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
