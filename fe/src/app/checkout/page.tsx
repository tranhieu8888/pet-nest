"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, CreditCard, Loader2, MapPin, Phone, Truck, CheckCircle2, User, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import Header from "@/components/layout/Header"
import axiosInstance, { api } from "../../../utils/axios"
import axios from "axios"

interface UserProfile {
  name: string
  email: string
  phone: string
  address: any[]
}

interface CartItem {
  _id: string
  quantity: number
  product: {
    _id: string
    name: string
    selectedVariant: {
      price: number
      images: { url: string }[]
      attributes: { value: string }[]
    }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [useStoredAddress, setUseStoredAddress] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [street, setStreet] = useState("")
  const [provinceCode, setProvinceCode] = useState("")
  const [districtCode, setDistrictCode] = useState("")
  const [wardCode, setWardCode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cod")

  const [provinces, setProvinces] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const rawIds = localStorage.getItem("checkoutItems")
        if (!rawIds) return router.push("/cart")
        const itemIds = JSON.parse(rawIds)
        if (itemIds.length === 0) return router.push("/cart")

        const cartRes = await axiosInstance.get("/cart/getcart")
        if (cartRes.data.success) {
          const checkoutItems = cartRes.data.data.cartItems.filter(
            (item: any) => itemIds.includes(item._id)
          )
          setItems(checkoutItems)
          if (checkoutItems.length === 0) return router.push("/cart")
        }

        const profileRes = await api.get("/auth/myprofile")
        if (profileRes.data.success) {
          const u = profileRes.data.user || profileRes.data.data
          setProfile(u)
          if (u.name) setName(u.name)
          if (u.email) setEmail(u.email)
          if (u.phone) setPhone(u.phone)
          if (u.address && u.address.length > 0) {
            setUseStoredAddress(true)
            const addr = u.address[0]
            if (addr.street) setStreet(addr.street)
          }
        }

        // Dùng API v2 (34 Tỉnh Thành mới - Cấu trúc 2 cấp: Tỉnh -> Phường/Xã)
        const provRes = await axios.get("https://provinces.open-api.vn/api/v2/p/")
        setProvinces(provRes.data)
      } catch (err) {
        console.error("Error loading checkout page:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (provinceCode) {
      axios
        .get(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`)
        .then((res) => {
          setWards(res.data.wards || [])
        })
        .catch(console.error)
      setWardCode("")
    }
  }, [provinceCode])

  const calculateSubTotal = () =>
    items.reduce((sum, item) => sum + item.product.selectedVariant.price * item.quantity, 0)

  const getShippingFee = () => {
    const hasStoredAddr = useStoredAddress && profile?.address && profile.address.length > 0;
    const hasNewAddr = !!(provinceCode && wardCode && street.trim());
    if (hasStoredAddr || hasNewAddr) return 30000;
    return 0;
  }

  const calculateTotal = () => calculateSubTotal() + getShippingFee()

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(price)) + "đ"

  const handlePlaceOrder = async () => {
    if (!name.trim()) return alert("Vui lòng nhập tên người nhận")
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return alert("Vui lòng nhập Email hợp lệ")
    if (!phone.trim()) return alert("Vui lòng nhập số điện thoại")

    let finalAddress: any = {}
    if (useStoredAddress && profile?.address?.length) {
      finalAddress = profile.address[0]
    } else {
      if (!provinceCode || !wardCode || !street.trim()) {
        alert("Vui lòng nhập đầy đủ thông tin địa chỉ")
        return
      }
      const provName = provinces.find((p) => p.code == provinceCode)?.name || ""
      const wardName = wards.find((w) => w.code == wardCode)?.name || ""
      finalAddress = { street, ward: wardName, district: "", province: provName }
    }

    try {
      setSubmitting(true)
      const payload = {
        cartItemIds: items.map((i) => i._id),
        address: finalAddress,
        phone,
        name,
        email,
        paymentMethod,
      }

      const response = await api.post("/orders", payload)
      if (response.data.success) {
        localStorage.removeItem("checkoutItems")
        if (paymentMethod === "payos" && response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl
        } else {
          router.push(`/order-success?orderId=${response.data.data._id}`)
        }
      } else {
        alert(response.data.message || "Đặt hàng thất bại")
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Lỗi hệ thống")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="animate-spin h-10 w-10 text-emerald-600 mb-4" />
          <p className="text-gray-500 font-medium">Đang tải biểu mẫu thanh toán...</p>
        </div>
      </div>
    )
  }

  const hasAddressProfile = profile?.address && profile.address.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/50 pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Cột Back */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" className="rounded-full h-12 w-12 p-0 bg-white shadow-sm hover:shadow border border-gray-100 hover:bg-gray-50 transition-all text-gray-700" onClick={() => router.push('/cart')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thanh toán</h1>
            <p className="text-gray-500 text-sm mt-1">Hoàn tất đặt hàng để nhận ngay các sản phẩm ưng ý</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Cột trái: Forms (8/12) */}
          <div className="lg:col-span-8 space-y-7">

            {/* Contact Info */}
            <Card className="rounded-3xl border border-gray-200/80 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-slate-50 border-b border-gray-100 pb-4 px-6 pt-5">
                <CardTitle className="text-lg flex items-center gap-2.5 font-bold text-gray-800">
                  <User className="w-5 h-5 text-blue-600" />
                  Thông tin liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-gray-600 font-medium text-xs uppercase tracking-wider">
                      Tên người nhận <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tên người nhận..."
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white rounded-xl h-11 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-600 font-medium text-xs uppercase tracking-wider">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email liên hệ..."
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white rounded-xl h-11 transition-all shadow-sm"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5 mt-1">
                    <Label className="text-gray-700 font-bold text-sm">
                      Số điện thoại <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại để liên lạc giao hàng..."
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white rounded-xl h-12 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="rounded-3xl border border-gray-200/80 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-slate-50 border-b border-gray-100 pb-4 px-6 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2.5 font-bold text-gray-800">
                    <MapPin className="w-5 h-5 text-red-500" />
                    Địa chỉ nhận hàng
                  </CardTitle>
                  {hasAddressProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUseStoredAddress(!useStoredAddress)}
                      className="text-xs h-8 rounded-full font-semibold border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm"
                    >
                      {useStoredAddress ? "Nhập địa chỉ mới" : "Sử dụng địa chỉ đã lưu"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {useStoredAddress && hasAddressProfile ? (
                  <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 flex items-start gap-4 transition-all hover:bg-emerald-50 w-full cursor-default">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900 mb-1.5 flex items-center gap-2">
                        Địa chỉ mặc định
                        <span className="bg-emerald-200/50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Đã lưu</span>
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed font-medium">
                        {profile?.address[0].street}
                        <br />
                        {[
                          profile?.address[0].ward,
                          profile?.address[0].province,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-bold text-sm">
                        Tỉnh / Thành phố <span className="text-red-500">*</span>
                      </Label>
                      <Select value={provinceCode} onValueChange={setProvinceCode}>
                        <SelectTrigger className="h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm bg-white">
                          <SelectValue placeholder="Chọn Tỉnh/Thành phố" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {provinces.map((p) => (
                            <SelectItem key={p.code} value={String(p.code)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-bold text-sm">
                        Phường / Xã <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={wardCode}
                        onValueChange={setWardCode}
                        disabled={!provinceCode}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm bg-white">
                          <SelectValue placeholder="Chọn Phường/Xã" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {wards.map((w) => (
                            <SelectItem key={w.code} value={String(w.code)}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-gray-700 font-bold text-sm">
                        Số nhà, tên đường chi tiết <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Ví dụ: Số 20 ngõ 15 đường Cầu Giấy..."
                        className="h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm bg-white"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="rounded-3xl border border-gray-200/80 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-slate-50 border-b border-gray-100 pb-4 px-6 pt-5">
                <CardTitle className="text-lg flex items-center gap-2.5 font-bold text-gray-800">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div
                    className={`relative flex items-center space-x-3 border-2 p-4 rounded-2xl cursor-pointer transition-all ${paymentMethod === "cod"
                      ? "border-emerald-500 bg-emerald-50/30 shadow-sm ring-1 ring-emerald-100"
                      : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                      }`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <RadioGroupItem value="cod" id="pm-cod" className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none shadow-sm" />
                    <Label htmlFor="pm-cod" className="flex-1 cursor-pointer font-bold text-gray-800 text-sm leading-snug">
                      Nhận hàng nhận tiền <br /><span className="text-gray-500 font-medium text-[13px]">(Thanh toán COD)</span>
                    </Label>
                    <Home className={`w-8 h-8 opacity-20 absolute right-4 top-1/2 -translate-y-1/2 ${paymentMethod === "cod" ? "text-emerald-600 opacity-30" : "text-gray-400"}`} />
                  </div>
                  <div
                    className={`relative flex items-center space-x-3 border-2 p-4 rounded-2xl cursor-pointer transition-all ${paymentMethod === "payos"
                      ? "border-blue-500 bg-blue-50/30 shadow-sm ring-1 ring-blue-100"
                      : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                      }`}
                    onClick={() => setPaymentMethod("payos")}
                  >
                    <RadioGroupItem value="payos" id="pm-payos" className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-none shadow-sm" />
                    <Label htmlFor="pm-payos" className="flex-1 cursor-pointer font-bold text-gray-800 text-sm leading-snug">
                      Thanh toán trực tuyến <br /><span className="text-gray-500 font-medium text-[13px]">(Thẻ/QR Code qua PayOS)</span>
                    </Label>
                    <CreditCard className={`w-8 h-8 opacity-20 absolute right-4 top-1/2 -translate-y-1/2 ${paymentMethod === "payos" ? "text-blue-600 opacity-30" : "text-gray-400"}`} />
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Cột phải: Order Summary (4/12) */}
          <div className="lg:col-span-4 lg:sticky lg:top-[120px]">
            <Card className="rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-500">
              <CardHeader className="bg-gray-50/80 border-b border-gray-100 pb-5 px-6 pt-6">
                <CardTitle className="text-[22px] font-extrabold text-gray-900 tracking-tight">Tóm tắt đơn hàng</CardTitle>
                <p className="text-sm text-gray-500 font-medium mt-1">Đã chọn <span className="font-bold text-gray-900">{items.length}</span> món</p>
              </CardHeader>

              <CardContent className="p-0">
                <div className="max-h-[35vh] overflow-y-auto p-6 space-y-5">
                  {items.map((item) => (
                    <div key={item._id} className="flex gap-4 group">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.product.selectedVariant?.images?.[0]?.url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm group-hover:shadow transition-all"
                        />
                        <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-[15px] font-bold text-gray-900 line-clamp-2 leading-tight mb-1">
                          {item.product.name}
                        </h4>
                        <div className="text-[13px] text-gray-500 font-medium mb-1.5 flex flex-wrap gap-1">
                          {item.product.selectedVariant?.attributes
                            ?.map((a) => (
                              <span key={a.value} className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-600 lowercase first-letter:uppercase">{a.value}</span>
                            ))}
                        </div>
                        <div className="text-sm font-black text-emerald-600">
                          {formatPrice(item.product.selectedVariant.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-4 rounded-b-[2rem]">
                  <div className="flex justify-between text-gray-600 font-medium text-sm">
                    <span>Giá sản phẩm</span>
                    <span className="text-gray-900">{formatPrice(calculateSubTotal())}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 font-medium text-sm">
                    <span>Phí giao hàng</span>
                    {getShippingFee() > 0 ? (
                      <span className="text-gray-900 font-bold">{formatPrice(getShippingFee())}</span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">-</span>
                    )}
                  </div>

                  <Separator className="my-2 bg-gray-200" />

                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-800 text-lg">Tổng cộng</span>
                    <div className="text-right">
                      <span className="text-[28px] leading-none font-black text-emerald-600 tracking-tight block">
                        {formatPrice(calculateTotal())}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6 h-[56px] text-lg font-extrabold bg-gray-900 hover:bg-gray-800 text-white transition-all shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-[0.98] rounded-2xl relative overflow-hidden group"
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2 relative z-10">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang tạo đơn hàng...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 relative z-10">
                        {paymentMethod === 'cod' ? "Hoàn Tất Đặt Hàng" : "Chuyển Đến Trang Thanh Toán"}
                        <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                    {!submitting && <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 content-['']" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
