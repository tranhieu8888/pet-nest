"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface OrderItem {
  cartItemId: string
  quantity: number
}

interface OrderData {
  addressId: string
  shippingMethod: string
  paymentMethod: string
  items: OrderItem[]
  amount: number
  buyAgainMode?: boolean
  rebuyItems?: OrderItem[]
  voucherId?: string
}

interface OrderContextType {
  orderData: OrderData | null
  setOrderData: (data: OrderData) => void
  clearOrderData: () => void
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderData, setOrderDataState] = useState<OrderData | null>(null)

  const setOrderData = (data: OrderData) => {
    setOrderDataState(data)
  }

  const clearOrderData = () => {
    setOrderDataState(null)
  }

  return (
    <OrderContext.Provider value={{ orderData, setOrderData, clearOrderData }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
} 