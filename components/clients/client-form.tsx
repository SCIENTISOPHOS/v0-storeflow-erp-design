"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { Client, ClientInput } from "@/types"

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSubmit: (data: ClientInput) => Promise<void>
}

const emptyForm: ClientInput = {
  name: "",
  phone: "",
  email: "",
  address: "",
  credit_limit: 0,
  notes: "",
}

export function ClientForm({ open, onOpenChange, client, onSubmit }: ClientFormProps) {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClientInput>(emptyForm)

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone: client.phone ?? "",
        email: client.email ?? "",
        address: client.address ?? "",
        credit_limit: Number(client.credit_limit),
        notes: client.notes ?? "",
      })
    } else {
      setFormData(emptyForm)
    }
  }, [client, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        notes: formData.notes || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting client:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? "Modifier le client" : "Ajouter un client"}</DialogTitle>
          <DialogDescription>
            {client ? "Modifiez les informations du client" : "Remplissez les informations du nouveau client"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Jean Dupont"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone ?? ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: +221 77 123 45 67"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optionnel)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email ?? ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="client@email.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse (optionnelle)</Label>
            <Input
              id="address"
              value={formData.address ?? ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rue, ville..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit_limit">
              Plafond de crédit (FCFA)
              {!isAdmin && (
                <span className="text-xs text-muted-foreground ml-2">(Admin uniquement)</span>
              )}
            </Label>
            <Input
              id="credit_limit"
              type="number"
              min="0"
              value={formData.credit_limit}
              onChange={(e) =>
                setFormData({ ...formData, credit_limit: Number.parseFloat(e.target.value) || 0 })
              }
              required
              disabled={loading || !isAdmin}
            />
            <p className="text-xs text-muted-foreground">Montant maximum que le client peut devoir</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes ?? ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires..."
              disabled={loading}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {client ? "Modification..." : "Ajout..."}
                </>
              ) : client ? (
                "Modifier"
              ) : (
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
