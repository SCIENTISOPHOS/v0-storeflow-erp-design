"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Client, ClientInput } from "@/types"

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase.from("clients").select("*").order("name", { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setClients((data ?? []) as Client[])
      setError(null)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchClients()

    const channel = supabase
      .channel("clients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => {
        fetchClients()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchClients])

  const addClient = async (input: ClientInput) => {
    const { data, error } = await supabase.from("clients").insert(input).select().single()
    if (error) throw new Error(error.message)
    return data as Client
  }

  const updateClient = async (id: string, input: Partial<ClientInput>) => {
    const { error } = await supabase
      .from("clients")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw new Error(error.message)
  }

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id)
    if (error) throw new Error(error.message)
  }

  const recordPayment = async (clientId: string, amount: number, notes?: string) => {
    const { data, error } = await supabase.rpc("record_payment", {
      p_client_id: clientId,
      p_amount: amount,
      p_notes: notes ?? null,
    })
    if (error) throw new Error(error.message)
    return data as string
  }

  const toggleBlock = async (id: string, isBlocked: boolean) => {
    const { error } = await supabase
      .from("clients")
      .update({ is_blocked: isBlocked, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw new Error(error.message)
  }

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    recordPayment,
    toggleBlock,
    refetch: fetchClients,
  }
}
