"use client";

import { useEffect, useState } from "react";
import { api } from "../../../../utils/axios";
import { 
  CreditCard, 
  Calendar, 
  User, 
  Scissors, 
  CheckCircle2, 
  Search,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface PaymentRecord {
  _id: string;
  bookingCode: string;
  customerSnapshot: {
    name: string;
    phone: string;
  };
  serviceSnapshot: {
    name: string;
    price: number;
  };
  updatedAt: string;
  paymentStatus: string;
}

export default function StaffPaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get("/payments/staff-history");
        if (response.data?.success) {
          setPayments(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => 
    p.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customerSnapshot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-emerald-600" />
            Lịch sử chuyển khoản
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý và đối soát các giao dịch thanh toán qua PayOS
          </p>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên khách..."
            className="pl-10 pr-4 py-2 border rounded-xl w-full md:w-80 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
          <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="text-emerald-600" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Không tìm thấy giao dịch nào</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            {searchTerm ? "Thử tìm kiếm với từ khóa khác" : "Hiện chưa có giao dịch thanh toán thành công nào được ghi nhận."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => (
            <div 
              key={payment._id} 
              className="bg-white rounded-3xl p-6 border border-emerald-50 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md group relative overflow-hidden"
            >
              {/* Decorative wave background */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-600 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-lg tracking-widest shadow-sm">
                    PAID
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {format(new Date(payment.updatedAt), "HH:mm, dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  {payment.bookingCode}
                </h3>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl border border-transparent group-hover:border-emerald-100 transition-all">
                    <User size={16} className="text-emerald-600 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-semibold text-gray-900 truncate">{payment.customerSnapshot.name}</p>
                      <p className="text-[10px] text-gray-400">{payment.customerSnapshot.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600 p-3 rounded-2xl">
                    <Scissors size={16} className="text-emerald-600 shrink-0" />
                    <p className="font-medium">{payment.serviceSnapshot.name}</p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-dashed border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Số tiền</p>
                    <p className="text-xl font-black text-emerald-600">
                      {payment.serviceSnapshot.price.toLocaleString("vi-VN")}
                      <span className="text-xs ml-1 font-bold italic">VND</span>
                    </p>
                  </div>
                  
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:rotate-12 transition-all duration-300">
                    <CheckCircle2 size={24} className="text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
