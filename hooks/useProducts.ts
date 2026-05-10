"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Product, ProductInput } from "@/types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setProducts((data ?? []) as Product[])
      setError(null)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProducts()

    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchProducts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchProducts])

  const addProduct = async (input: ProductInput) => {
    const { data, error } = await supabase.from("products").insert(input).select().single()
    if (error) throw new Error(error.message)
    return data as Product
  }

  const updateProduct = async (id: string, input: Partial<ProductInput>) => {
    const { error } = await supabase
      .from("products")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw new Error(error.message)
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) throw new Error(error.message)
  }

  const adjustStock = async (id: string, newQuantity: number) => {
    if (newQuantity < 0) throw new Error("La quantite ne peut pas etre negative")
    const { error } = await supabase
      .from("products")
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw new Error(error.message)
  }

  const splitSac = async (sacId: string, divisibility = 500) => {
    const { data, error } = await supabase.rpc("split_sac", {
      p_sac_id: sacId,
      p_divisibility: divisibility,
    })
    if (error) throw new Error(error.message)
    return data as string
  }

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    splitSac,
    refetch: fetchProducts,
  }
}
