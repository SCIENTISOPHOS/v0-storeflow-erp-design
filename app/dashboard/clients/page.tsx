"use client"

import { useState } from "react"
import { useClients } from "@/hooks/useClients"
import { DashboardHeader } from "@/components/dashboard/header"
import { ClientTable } from "@/components/clients/client-table"
import { ClientForm } from "@/components/clients/client-form"
import { PaymentForm } from "@/components/clients/payment-form"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Client, ClientInput } from "@/types"

export default function ClientsPage() {
  const { clients, loading, addClient, updateClient, deleteClient, recordPayment, toggleBlock } =
    useClients()
  const [formOpen, setFormOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [payingClient, setPayingClient] = useState<Client | null>(null)

  const handleSubmit = async (data: ClientInput) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data)
        toast.success("Client modifié avec succès")
      } else {
        await addClient(data)
        toast.success("Client ajouté avec succès")
      }
      setEditingClient(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
      throw error
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id)
      toast.success("Client supprimé avec succès")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  const handlePayment = (client: Client) => {
    setPayingClient(client)
    setPaymentOpen(true)
  }

  const handlePaymentSubmit = async (clientId: string, amount: number, notes?: string) => {
    try {
      await recordPayment(clientId, amount, notes)
      toast.success(`Paiement de ${amount.toLocaleString("fr-FR")} FCFA encaissé`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'encaissement")
      throw error
    }
  }

  const handleToggleBlock = async (id: string, isBlocked: boolean) => {
    try {
      await toggleBlock(id, isBlocked)
      toast.success(isBlocked ? "Client bloqué" : "Client débloqué")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur")
    }
  }

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditingClient(null)
  }

  const totalDebt = clients.reduce((acc, c) => acc + Number(c.current_balance), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Gestion des clients"
        description={`${clients.length} clients · Créances: ${totalDebt.toLocaleString("fr-FR")} FCFA`}
      >
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </DashboardHeader>

      <ClientTable
        clients={clients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPayment={handlePayment}
        onToggleBlock={handleToggleBlock}
      />

      <ClientForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        client={editingClient}
        onSubmit={handleSubmit}
      />

      <PaymentForm
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        client={payingClient}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  )
}
