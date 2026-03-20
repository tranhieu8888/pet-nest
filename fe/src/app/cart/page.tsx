"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Header from "@/components/layout/Header"
import axiosInstance from "../../../utils/axios"
import { useRouter } from "next/navigation"
import { useLanguage } from '@/context/LanguageContext';
import viConfig from '../../../utils/petPagesConfig.vi';
import enConfig from '../../../utils/petPagesConfig.en';

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
    selectedVariant: {
      _id: string
      price: number
      images: {
        _id?: string
        url: string
      }[]
      attributes: {
        value: string
      }[]
      importedQuantity?: number
      orderedQuantity?: number
      availableQuantity?: number
    }
  }
}

interface CartResponse {
  success: boolean
  message: string
  data: {
    _id: string
    userId: string
    cartItems: CartItem[]
    summary: {
      totalItems: number
      totalPrice: number
    }
  }
}

export default function ShoppingCart() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [rebuyItems, setRebuyItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { lang } = useLanguage();
  const config = lang === 'vi' ? viConfig : enConfig;
  const cartConfig = config.cart;

  // Hàm lấy số lượng tồn kho thực tế và trạng thái còn hàng
  const getStockAvailable = (item: CartItem) => {
    // Ưu tiên lấy availableQuantity từ item, nếu không có thì lấy từ selectedVariant
    if (typeof item.availableQuantity === 'number') {
      return item.availableQuantity;
    }
    if (typeof item.product.selectedVariant.availableQuantity === 'number') {
      return item.product.selectedVariant.availableQuantity;
    }
    return 0;
  };

  const getIsStockAvailable = (item: CartItem) => {
    if (typeof item.isStockAvailable === 'boolean') {
      return item.isStockAvailable;
    }
    // Nếu không có, fallback: còn hàng nếu availableQuantity > 0
    const qty = typeof item.availableQuantity === 'number'
      ? item.availableQuantity
      : (typeof item.product.selectedVariant.availableQuantity === 'number'
          ? item.product.selectedVariant.availableQuantity
          : 0);
    return qty > 0;
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get('/cart/getcart')
        if (response.data.success) {
          let fetchedItems: CartItem[] = response.data.data.cartItems;
          // Kiểm tra và cập nhật số lượng nếu vượt quá tồn kho
          const updatedItems = await Promise.all(fetchedItems.map(async (item) => {
            const stockAvailable = getStockAvailable(item);
            if (item.quantity > stockAvailable && stockAvailable > 0) {
              // Gọi API updatecart để đồng bộ backend
              try {
                await axiosInstance.put('/cart/updatecart', {
                  cartItemId: item._id,
                  quantity: stockAvailable
                });
              } catch (e) {
                // Có thể log lỗi nếu cần
              }
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

  // Load rebuy items from session storage on component mount
  useEffect(() => {
    const savedRebuyItems = sessionStorage.getItem('rebuyItems')
    if (savedRebuyItems) {
      setRebuyItems(JSON.parse(savedRebuyItems))
    }
  }, [])

  // Save rebuy items to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('rebuyItems', JSON.stringify(rebuyItems))
  }, [rebuyItems])

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      const response = await axiosInstance.put('/cart/updatecart', {
        cartItemId: id,
        quantity: newQuantity
      })
      if (response.data.success) {
        setCartItems(items => 
          items.map(item => 
            item._id === id ? { ...item, quantity: newQuantity } : item
          )
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
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  const toggleRebuySelection = (id: string) => {
    setRebuyItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Thêm biến kiểm tra có sản phẩm hết hàng
  const hasOutOfStock = cartItems.some(item => !getIsStockAvailable(item));

  // Sửa hàm toggleSelectAll để chọn tất cả sản phẩm (kể cả hết hàng)
  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
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

  const handleBuyNow = () => {
    // Kiểm tra có sản phẩm hết hàng trong selectedItems không
    const hasOutOfStockSelected = cartItems
      .filter(item => selectedItems.includes(item._id))
      .some(item => !getIsStockAvailable(item));

    if (selectedItems.length === 0) return;

    if (hasOutOfStockSelected) {
      alert('Trong giỏ hàng có sản phẩm hết hàng, vui lòng bỏ chọn sản phẩm này trước khi thanh toán!');
      return;
    }

    // Store selected items in localStorage for checkout page
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    router.push('/checkout');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{cartConfig.error}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.push('/homepage')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {cartConfig.continueShopping}
            </Button>
          </div>

          <Card className="text-center py-16">
            <CardContent>
              <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">{cartConfig.emptyTitle}</h2>
              <p className="text-gray-600 mb-6">{cartConfig.emptyDesc}</p>
              <Button>{cartConfig.startShopping}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hover:bg-gray-100" onClick={() => router.push('/homepage')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {cartConfig.continueShopping}
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{cartConfig.title}</h1>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
              {cartConfig.productCount.replace('{count}', cartItems.length.toString())}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Select All */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                    onChange={toggleSelectAll}
                    className="border-gray-300"
                  />
                  <label htmlFor="select-all" className="font-medium cursor-pointer text-gray-700">
                    {cartConfig.selectAll.replace('{selected}', selectedItems.length.toString()).replace('{total}', cartItems.length.toString())}
                  </label>
                </div>

                {selectedItems.length > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{cartConfig.selectedTotal}</div>
                    <div className="text-xl font-semibold text-blue-600">{formatPrice(calculateSelectedTotal())}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          {cartItems.map((item) => {
            const stockAvailable = getStockAvailable(item);
            const isOutOfStock = !getIsStockAvailable(item);
            const isOverQuantity = item.quantity > stockAvailable;
            return (
              <Card
                key={item._id}
                className={`shadow-sm hover:shadow-md transition-all duration-200
                  ${selectedItems.includes(item._id) ? "ring-2 ring-blue-500 bg-blue-50/50" : ""}
                  ${rebuyItems.includes(item._id) ? "ring-2 ring-green-500 bg-green-50/50" : ""}
                  ${(isOutOfStock || isOverQuantity) ? "opacity-50 line-through" : ""}
                `}
              >
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="flex items-start pt-2">
                      <Checkbox
                        id={`item-${item._id}`}
                        checked={selectedItems.includes(item._id)}
                        onChange={() => toggleItemSelection(item._id)}
                        className="border-gray-300"
                      />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id={`rebuy-${item._id}`}
                        checked={rebuyItems.includes(item._id)}
                        onChange={() => toggleRebuySelection(item._id)}
                        className="border-green-300"
                      />
                      <label htmlFor={`rebuy-${item._id}`} className="text-xs text-green-600 cursor-pointer">
                        Mua lại
                      </label>
                    </div>

                    <img
                      src={item.product.selectedVariant.images[0]?.url || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-28 h-28 object-cover rounded-lg shadow-sm"
                    />

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {item.product.name}
                          {(isOutOfStock || isOverQuantity) && (
                            <span className="ml-2 text-red-500 text-sm font-normal">
                              {isOutOfStock ? "Hết hàng" : isOverQuantity ? "Không đủ hàng" : ""}
                            </span>
                          )}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex gap-4 text-sm text-gray-600 mb-4">
                        {item.product.selectedVariant.attributes.map((attr, index) => (
                          <span key={index} className="bg-gray-100 px-3 py-1 rounded-full">
                            {attr.value}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isOutOfStock}
                            className="border-gray-300 hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium text-gray-900">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            disabled={item.quantity >= stockAvailable || isOutOfStock}
                            className="border-gray-300 hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-semibold text-xl ${
                              selectedItems.includes(item._id) ? "text-blue-600" : "text-gray-900"
                            }`}
                          >
                            {formatPrice(item.product.selectedVariant.price * item.quantity)}
                            {selectedItems.includes(item._id) && (
                              <span className="text-xs text-blue-500 block mt-1">{cartConfig.selected}</span>
                            )}
                            {rebuyItems.includes(item._id) && (
                              <span className="text-xs text-green-500 block mt-1">✓ Mua lại</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {cartConfig.pricePerProduct.replace('{price}', formatPrice(item.product.selectedVariant.price))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="font-medium text-gray-900">
              {cartConfig.selectedCount.replace('{count}', selectedItems.length.toString())}
              <span className="text-blue-600 font-semibold ml-2 text-xl">{formatPrice(calculateSelectedTotal())}</span>
            </div>
            <div className="flex gap-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                onClick={handleBuyNow}
              >
                {cartConfig.buyNow.replace('{count}', selectedItems.length.toString())}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}