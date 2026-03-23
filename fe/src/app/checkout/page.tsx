"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, CreditCard, Loader2, MapPin, Phone, Truck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

  // Address mode
  const [useStoredAddress, setUseStoredAddress] = useState(false)

  // Form state
  const [phone, setPhone] = useState("")
  const [street, setStreet] = useState("")
  const [provinceCode, setProvinceCode] = useState("")
  const [districtCode, setDistrictCode] = useState("")
  const [wardCode, setWardCode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cod")

  // Vietnamese address data
  const [provinces, setProvinces] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 1. Load checkout items from localStorage
        const rawIds = localStorage.getItem("checkoutItems")
        if (!rawIds) {
          router.push("/cart")
          return
        }
        const itemIds = JSON.parse(rawIds)
        if (itemIds.length === 0) {
          router.push("/cart")
          return
        }

        // Fetch cart to get item details
        const cartRes = await axiosInstance.get("/cart/getcart")
        if (cartRes.data.success) {
          const checkoutItems = cartRes.data.data.cartItems.filter(
            (item: any) => itemIds.includes(item._id)
          )
          setItems(checkoutItems)
          if (checkoutItems.length === 0) {
            router.push("/cart")
            return
          }
        }

        // 2. Load User Profile
        const profileRes = await api.get("/auth/myprofile")
        if (profileRes.data.success) {
          const u = profileRes.data.user || profileRes.data.data
          setProfile(u)
          if (u.phone) setPhone(u.phone)
          if (u.address && u.address.length > 0) {
            setUseStoredAddress(true)
            const addr = u.address[0]
            if (addr.street) setStreet(addr.street)
          }
        }

        // 3. Load Provinces
        const provRes = await axios.get("https://provinces.open-api.vn/api/p/")
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
        .get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
        .then((res) => setDistricts(res.data.districts))
        .catch(console.error)
      setDistrictCode("")
      setWardCode("")
      setWards([])
    }
  }, [provinceCode])

  useEffect(() => {
    if (districtCode) {
      axios
        .get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
        .then((res) => setWards(res.data.wards))
        .catch(console.error)
      setWardCode("")
    }
  }, [districtCode])

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.product.selectedVariant.price * item.quantity, 0)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(price)) + "đ"

  const handlePlaceOrder = async () => {
    if (!phone.trim()) {
      alert("Vui lòng nhập số điện thoại")
      return
    }

    let finalAddress: any = {}
    if (useStoredAddress && profile?.address?.length) {
      finalAddress = profile.address[0]
    } else {
      if (!provinceCode || !districtCode || !wardCode || !street.trim()) {
        alert("Vui lòng nhập đầy đủ thông tin địa chỉ")
        return
      }
      const provName = provinces.find((p) => p.code == provinceCode)?.name || ""
      const distName = districts.find((d) => d.code == districtCode)?.name || ""
      const wardName = wards.find((w) => w.code == wardCode)?.name || ""
      finalAddress = { street, ward: wardName, district: distName, province: provName }
    }

    try {
      setSubmitting(true)
      const payload = {
        cartItemIds: items.map((i) => i._id),
        address: finalAddress,
        phone,
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-gray-500 text-sm">
          <span
            className="cursor-pointer hover:text-blue-600 font-medium transition-colors"
            onClick={() => router.push("/cart")}
          >
            Giỏ hàng
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-semibold">Thanh toán</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="border-b border-gray-50 bg-white rounded-t-xl">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Thông tin liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-gray-700">Tên người nhận</Label>
                    <Input disabled value={profile?.name || ""} className="bg-gray-50" />
                  </div>
                  <div>
                    <Label className="mb-2 block text-gray-700">Email</Label>
                    <Input disabled value={profile?.email || ""} className="bg-gray-50" />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-2 block text-gray-700 text-sm font-semibold">
                      Số điện thoại <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                      className="border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="border-b border-gray-50 bg-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    Địa chỉ giao hàng
                  </CardTitle>
                  {profile?.address && profile.address.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUseStoredAddress(!useStoredAddress)}
                      className="text-xs"
                    >
                      {useStoredAddress ? "Nhập địa chỉ mới" : "Dùng địa chỉ đã lưu"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {useStoredAddress && profile?.address?.length ? (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Địa chỉ mặc định</p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {profile.address[0].street}
                        <br />
                        {[
                          profile.address[0].ward,
                          profile.address[0].district,
                          profile.address[0].province,
                          profile.address[0].city,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                        <br />
                        {profile.address[0].country}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Tỉnh / Thành phố <span className="text-red-500">*</span>
                        </Label>
                        <Select value={provinceCode} onValueChange={setProvinceCode}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn Tỉnh/Thành phố" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((p) => (
                              <SelectItem key={p.code} value={String(p.code)}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Quận / Huyện <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={districtCode}
                          onValueChange={setDistrictCode}
                          disabled={!provinceCode}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn Quận/Huyện" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((d) => (
                              <SelectItem key={d.code} value={String(d.code)}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>
                          Phường / Xã <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={wardCode}
                          onValueChange={setWardCode}
                          disabled={!districtCode}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn Phường/Xã" />
                          </SelectTrigger>
                          <SelectContent>
                            {wards.map((w) => (
                              <SelectItem key={w.code} value={String(w.code)}>
                                {w.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>
                          Số nhà, tên đường <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Nhập địa chỉ chi tiết"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="border-b border-gray-50 bg-white rounded-t-xl">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  <div
                    className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === "cod"
                        ? "border-emerald-500 bg-emerald-50/20"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <RadioGroupItem value="cod" id="pm-cod" />
                    <Label htmlFor="pm-cod" className="flex-1 cursor-pointer font-medium">
                      Thanh toán khi nhận hàng (COD)
                    </Label>
                    <Truck className="w-5 h-5 text-gray-400" />
                  </div>
                  <div
                    className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === "payos"
                        ? "border-blue-500 bg-blue-50/20"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("payos")}
                  >
                    <RadioGroupItem value="payos" id="pm-payos" />
                    <Label htmlFor="pm-payos" className="flex-1 cursor-pointer font-medium">
                      Thanh toán trực tuyến (PayOS)
                    </Label>
                    <CreditCard className="w-5 h-5 text-blue-500" />
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right column — Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-md bg-white border-0 ring-1 ring-gray-100">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 rounded-t-xl pb-4">
                <CardTitle className="text-lg">Đơn hàng của bạn</CardTitle>
                <p className="text-sm text-gray-500">{items.length} sản phẩm</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[40vh] overflow-y-auto p-6 space-y-4">
                  {items.map((item) => (
                    <div key={item._id} className="flex gap-4">
                      <div className="relative">
                        <img
                          src={item.product.selectedVariant?.images?.[0]?.url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                        />
                        <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h4>
                        <div className="text-xs text-gray-500 mt-1 mb-2">
                          {item.product.selectedVariant?.attributes
                            ?.map((a) => a.value)
                            .join(", ")}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatPrice(item.product.selectedVariant.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50/50 rounded-b-xl border-t border-gray-100 space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(calculateTotal())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className="text-emerald-600 font-semibold">Miễn phí</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-2xl font-black text-blue-600">
                      {formatPrice(calculateTotal())}
                    </span>
                  </div>

                  <Button
                    className="w-full mt-6 h-12 text-base font-bold bg-gray-900 hover:bg-gray-800 transition-colors"
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : (
                      "Đặt hàng"
                    )}
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
