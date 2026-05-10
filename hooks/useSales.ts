"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { SaleWithItems, CartItem, PaymentMethod } from "@/types"

interface CreateSaleParams {
  clientId: string | null
  paymentMethod: PaymentMethod
  items: CartItem[]
  discount?: number
  amountPaid?: number
  notes?: string
}

export function useSales(limit = 100) {
  const [sales, setSales] = useState<SaleWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchSales = useCallback(async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*, sale_items(*), clients(name), profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      setError(error.message)
    } else {
      setSales((data ?? []) as unknown as SaleWithItems[])
      setError(null)
    }
    setLoading(false)
  }, [supabase, limit])

  useEffect(() => {
    fetchSales()

    const channel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        fetchSales()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchSales])

  const createSale = async (params: CreateSaleParams): Promise<string> => {
    const subtotal = params.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    )
    const discount = params.discount ?? 0
    const total = subtotal - discount
    const amountPaid = params.paymentMethod === "cash" ? total : (params.amountPaid ?? 0)

    const itemsPayload = params.items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: Number(item.product.price),
      total: Number(item.product.price) * item.quantity,
    }))

    const { data, error } = await supabase.rpc("create_sale", {
      p_client_id: params.clientId,
      p_payment_method: params.paymentMethod,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_amount_paid: amountPaid,
      p_notes: params.notes ?? null,
      p_items: itemsPayload,
    })

    if (error) throw new Error(error.message)
    return data as string
  }

  // Helpers for dashboard
  const getTodaySales = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return sales.filter((sale) => new Date(sale.created_at) >= today)
  }

  const getTodayTotal = () => getTodaySales().reduce((acc, sale) => acc + Number(sale.total), 0)

  const getTodayCashTotal = () =>
    getTodaySales()
      .filter((s) => s.payment_method === "cash")
      .reduce((acc, sale) => acc + Number(sale.total), 0)

  return {
    sales,
    loading,
    error,
    createSale,
    getTodaySales,
    getTodayTotal,
    getTodayCashTotal,
    refetch: fetchSales,
  }
}
