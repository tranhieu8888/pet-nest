"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/layout/Header"
import { api } from "../../../utils/axios"

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams?.get("orderId") || searchParams?.get("id")

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get(`/orders/${orderId}`)
        if (res.data.success) {
          setOrder(res.data.data)
        }
      } catch (err) {
        console.error("Lỗi khi tải đơn hàng", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(price)) + "đ"

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-0 shadow-xl overflow-hidden rounded-3xl">
        <div className="bg-emerald-500 p-8 flex flex-col items-center justify-center text-white">
          <CheckCircle2 className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-bold">Đặt hàng thành công!</h1>
          <p className="mt-2 text-emerald-100 font-medium">Cảm ơn bạn đã tin tưởng Pet Nest.</p>
        </div>

        <CardContent className="p-8 space-y-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : order ? (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Mã đơn hàng</span>
                <span className="font-bold font-mono text-gray-900">
                  #{order._id?.toString().slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Thanh toán</span>
                <span className="font-semibold text-gray-900 uppercase">
                  {order.paymentMethod === "payos" || order.paymentMethod === "payos-paid"
                    ? "PayOS"
                    : "COD"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Trạng thái</span>
                <span className={`font-semibold ${
                  order.status === 'completed' ? 'text-emerald-600' :
                  order.status === 'cancelled' ? 'text-red-600' :
                  order.status === 'shipping' ? 'text-blue-600' : 'text-amber-600'
                }`}>
                  {order.status === 'completed' ? 'Hoàn thành' :
                   order.status === 'cancelled' ? 'Đã hủy' :
                   order.status === 'shipping' ? 'Đang giao hàng' : 'Đang xử lý'}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Tổng tiền</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Không tìm thấy thông tin chi tiết đơn hàng.</div>
          )}

          <div className="space-y-3 pt-4">
            <Button
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-base font-semibold transition-all rounded-xl"
              onClick={() => router.push("/homepage")}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </div>
  )
}
