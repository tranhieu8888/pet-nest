"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShieldCheck, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Header from "@/components/layout/Header"
import axiosInstance from "../../../utils/axios"
import { useRouter } from "next/navigation"
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../utils/petPagesConfig.vi';
import enConfig from '../../../utils/petPagesConfig.en';
import { ButtonCore } from "@/components/core/ButtonCore";

interface CartItem {
  _id: string
  quantity: number
  isStockAvailable?: boolean
  availableQuantity?: number
  importedQuantity?: number
  orderedQuantity?: number
  product: {
    _id: string
    name: string
    description: string
    category: {
      _id: string
      name: string
    }[]
    selectedVariant: {
      _id: string
      price: number
      images: {
        _id?: string
        url: string
      }[]
      attributes: {
        _id: string
        value: string
        parentId: string | null
      }[]
      importedQuantity?: number
      orderedQuantity?: number
      availableQuantity?: number
    }
  }
}

export default function ShoppingCart() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { lang } = useLanguage();
  const config = lang === 'vi' ? viConfig : enConfig;
  const cartConfig = config.cart;

  const getStockAvailable = (item: CartItem) => {
    if (typeof item.availableQuantity === 'number') return item.availableQuantity;
    if (typeof item.product.selectedVariant.availableQuantity === 'number') return item.product.selectedVariant.availableQuantity;
    return 0;
  };

  const getIsStockAvailable = (item: CartItem) => {
    if (typeof item.isStockAvailable === 'boolean') return item.isStockAvailable;
    const qty = getStockAvailable(item);
    return qty > 0;
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get('/cart/getcart')
        if (response.data.success) {
          const fetchedItems: CartItem[] = response.data.data.cartItems;
          const updatedItems = await Promise.all(fetchedItems.map(async (item) => {
            const stockAvailable = getStockAvailable(item);
            if (item.quantity > stockAvailable && stockAvailable > 0) {
              try {
                await axiosInstance.put('/cart/updatecart', {
                  cartItemId: item._id,
                  quantity: stockAvailable
                });
              } catch (e) {}
              return { ...item, quantity: stockAvailable };
            }
            return item;
          }));
          setCartItems(updatedItems);
        } else {
          throw new Error(response.data.message || 'Failed to fetch cart')
        }
      } catch (err) {
        console.error('Error fetching cart:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching cart')
      } finally {
        setLoading(false)
      }
    }
    fetchCart()
  }, [])

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      const response = await axiosInstance.put('/cart/updatecart', {
        cartItemId: id,
        quantity: newQuantity
      })
      if (response.data.success) {
        setCartItems(items => 
          items.map(item => item._id === id ? { ...item, quantity: newQuantity } : item)
        )
      }
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  const removeItem = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/cart/deletecartitem/${id}`)
      if (response.data.success) {
        setCartItems(items => items.filter(item => item._id !== id))
        setSelectedItems(prev => prev.filter(itemId => itemId !== id))
      }
    } catch (err) {
      console.error('Error removing item:', err)
    }
  }

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id])
  }

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item._id));
    }
  }

  const calculateSelectedTotal = () => {
    return cartItems
      .filter(item => selectedItems.includes(item._id))
      .reduce((sum, item) => sum + item.product.selectedVariant.price * item.quantity, 0)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(price)) + "₫";
  }

  const handleBuyNow = () => {
    const hasOutOfStockSelected = cartItems
      .filter(item => selectedItems.includes(item._id))
      .some(item => !getIsStockAvailable(item));

    if (selectedItems.length === 0) return;
    if (hasOutOfStockSelected) {
      alert('Trong giỏ hàng có sản phẩm hết hàng hoặc không đủ hàng, vui lòng bỏ chọn sản phẩm này trước khi thanh toán!');
      return;
    }
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    router.push('/checkout');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">{cartConfig.error}</h2>
        <p className="text-gray-500">{error}</p>
        <ButtonCore onClick={() => router.push('/homepage')} variantType="primary">
           Quay về trang chủ
        </ButtonCore>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="w-56 h-56 mb-8 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner relative">
             <div className="absolute inset-2 bg-white rounded-full opacity-80 backdrop-blur-sm" />
             <ShoppingBag className="w-24 h-24 text-emerald-600 relative z-10 opacity-90 drop-shadow-md" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">{cartConfig.emptyTitle}</h2>
          <p className="text-gray-500 mb-8 max-w-sm text-center text-lg">{cartConfig.emptyDesc}</p>
          <ButtonCore 
            onClick={() => router.push('/homepage')} 
            variantType="secondary"
          >
            {cartConfig.startShopping}
          </ButtonCore>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/50 pb-20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Tiêu đề & Cột Back */}
        <div className="flex items-center gap-4 mb-8">
          <ButtonCore 
            variantType="outline" 
            className="h-12 w-12 p-0" 
            onClick={() => router.push('/homepage')}
          >
            <ArrowLeft className="h-5 w-5" />
          </ButtonCore>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{cartConfig.title || "Giỏ Hàng Của Bạn"}</h1>
            <p className="text-gray-500 text-sm mt-1">Đang có <span className="font-semibold text-pink-600">{cartItems.length}</span> sản phẩm nằm trong giỏ</p>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cột Trái: Danh sách Sản Phẩm (8/12) */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            
            {/* Header Cột Menu */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-4 px-6 flex items-center justify-between sticky top-[76px] z-30">
               <div className="flex items-center gap-3">
                 <Checkbox 
                    id="select-all" 
                    checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                    onChange={() => toggleSelectAll(selectedItems.length !== cartItems.length || cartItems.length === 0)}
                    className="w-5 h-5 rounded data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none shadow-sm"
                 />
                 <label htmlFor="select-all" className="cursor-pointer font-semibold text-gray-800 select-none">
                    Chọn Tất Cả ({cartItems.length})
                 </label>
               </div>
               {selectedItems.length > 0 && (
                 <span className="text-sm font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full">Đã chọn {selectedItems.length} món</span>
               )}
            </div>

            {/* Danh Sách Món */}
            <div className="space-y-4">
              {cartItems.map((item) => {
                const stockAvailable = getStockAvailable(item);
                const isOutOfStock = !getIsStockAvailable(item);
                const isOverQuantity = item.quantity > stockAvailable;
                const isSelected = selectedItems.includes(item._id);

                return (
                  <div
                    key={item._id}
                    className={`relative bg-white p-5 rounded-3xl shadow-sm border transition-all duration-300 hover:shadow-md 
                      ${isSelected ? "border-pink-300 ring-2 ring-pink-100/50 bg-pink-50/10" : "border-gray-100 lg:hover:w-[101%]"}
                      ${(isOutOfStock || isOverQuantity) ? "opacity-60 grayscale-[30%] bg-gray-50" : ""}
                    `}
                  >
                    <div className="flex items-center sm:items-start gap-4 sm:gap-6">
                      {/* Checkbox */}
                      <div className="pt-2 sm:pt-4 flex-shrink-0">
                         <Checkbox 
                            id={`item-${item._id}`}
                            checked={isSelected}
                            onChange={() => toggleItemSelection(item._id)}
                            className="w-5 h-5 rounded data-[state=checked]:bg-pink-500 data-[state=checked]:border-none shadow-sm"
                            disabled={isOutOfStock}
                         />
                      </div>

                      {/* Hình Ảnh */}
                      <div className="relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden shadow-sm group">
                        <img
                          src={item.product.selectedVariant.images[0]?.url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {(isOutOfStock || isOverQuantity) && (
                           <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                              <Badge variant="secondary" className="bg-red-500 text-white font-semibold text-xs border-0 py-1 uppercase shadow-md pointer-events-none tracking-widest px-2 scale-[0.85]">
                                {isOutOfStock ? "Hết Hàng" : "Không Đủ"}
                              </Badge>
                           </div>
                        )}
                      </div>

                      {/* Thông tin */}
                      <div className="flex-1 min-w-0 py-1 pb-2 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {item.product.category?.map((cat) => (
                                <span key={cat._id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tight">
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                            <div className="flex justify-between items-start">
                               <h3 className="font-bold text-gray-900 text-base sm:text-lg lg:text-[19px] leading-tight mb-2 line-clamp-2 pr-4">{item.product.name}</h3>
                              <ButtonCore
                                variantType="ghost"
                                onClick={() => removeItem(item._id)}
                                className="text-gray-400 hover:text-red-500 w-8 h-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </ButtonCore>
                           </div>
                           
                            <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500 font-medium mb-3">
                             {item.product.selectedVariant.attributes
                               // Chỉ hiển thị các attribute có parentId (là các giá trị được chọn)
                               // Nếu có cả parent trong list (parentId === null), ta dùng nó để làm label
                               .filter(attr => attr.parentId !== null)
                               .map((attr, index) => {
                                 const parent = item.product.selectedVariant.attributes.find(p => p._id === attr.parentId);
                                 return (
                                   <span key={index} className="bg-gray-100/80 px-2.5 py-1 rounded-lg border border-gray-200/60 flex items-center gap-1.5 shadow-sm">
                                     {parent && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{parent.value}:</span>}
                                     <span className="text-gray-700 font-bold lowercase first-letter:uppercase">{attr.value}</span>
                                   </span>
                                 );
                               })}
                            </div>
                        </div>

                        {/* Controls & Price */}
                         <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-0 mt-auto pt-2">
                           <div className="flex items-center bg-gray-50/80 border border-gray-200 rounded-xl p-1 shadow-inner h-10 w-fit">
                             <ButtonCore
                               variantType="ghost"
                               onClick={() => updateQuantity(item._id, item.quantity - 1)}
                               disabled={item.quantity <= 1 || isOutOfStock}
                               className="h-8 w-8 p-0"
                             >
                               <Minus className="h-3.5 w-3.5" />
                             </ButtonCore>
                             <span className="w-10 text-center font-bold text-gray-900 text-sm select-none">
                               {item.quantity}
                             </span>
                             <ButtonCore
                               variantType="ghost"
                               onClick={() => updateQuantity(item._id, item.quantity + 1)}
                               disabled={item.quantity >= stockAvailable || isOutOfStock}
                               className="h-8 w-8 p-0"
                             >
                               <Plus className="h-3.5 w-3.5" />
                             </ButtonCore>
                           </div>

                           <div className="flex flex-col sm:items-end">
                              <span className="font-bold text-xl text-pink-600 tracking-tight">
                                {formatPrice(item.product.selectedVariant.price * item.quantity)}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-400 font-medium tracking-wide mt-0.5">
                                  {formatPrice(item.product.selectedVariant.price)}/sp
                                </span>
                              )}
                           </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột Phải: Order Summary (4/12) */}
          <div className="lg:col-span-4 lg:sticky lg:top-[120px]">
            <Card className="rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-500">
              
              <div className="p-7 space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tổng Lập Đơn</h2>
                  <p className="text-gray-500 text-sm mt-1 font-medium bg-gray-50 rounded-lg p-2.5 px-3">
                    Bao gồm <span className="font-bold text-gray-900">{selectedItems.length}</span> sản phẩm được chọn
                  </p>
                </div>

                <div className="space-y-4">
                </div>

                <Separator className="bg-gray-100" />

                <div className="flex justify-between items-end">
                  <span className="text-gray-800 font-bold text-lg">Tổng cộng</span>
                  <div className="text-right">
                    <div className="text-[28px] leading-none font-black text-pink-600 tracking-tight">
                      {formatPrice(calculateSelectedTotal())}
                    </div>
                  </div>
                </div>

                <ButtonCore 
                  variantType="primary"
                  className="w-full h-[60px]"
                  onClick={handleBuyNow}
                  disabled={selectedItems.length === 0}
                  rightIcon={selectedItems.length > 0 && <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />}
                >
                  {selectedItems.length > 0 ? "Thanh Toán Ngay" : "Vui lòng chọn sản phẩm"}
                </ButtonCore>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}