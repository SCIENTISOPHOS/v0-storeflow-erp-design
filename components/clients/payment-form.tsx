"use client"

import { useState, useEffect } from "react"
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
import type { Client } from "@/types"

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSubmit: (clientId: string, amount: number, notes?: string) => Promise<void>
}

export function PaymentForm({ open, onOpenChange, client, onSubmit }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open) {
      setAmount("")
      setNotes("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    setLoading(true)
    try {
      await onSubmit(client.id, Number.parseFloat(amount) || 0, notes || undefined)
      onOpenChange(false)
    } catch (error) {
      console.error("Error processing payment:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!client) return null

  const balance = Number(client.current_balance)
  const amountValue = Number.parseFloat(amount) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Encaisser un paiement</DialogTitle>
          <DialogDescription>
            Client: <strong>{client.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Solde actuel:</span>
              <span className="text-lg font-bold text-destructive">
                {balance.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant du paiement (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={balance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant reçu en espèces"
              required
              disabled={loading}
            />
            {amountValue > balance && (
              <p className="text-xs text-destructive">Le montant ne peut pas dépasser le solde dû</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Référence, méthode de paiement..."
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Nouveau solde:</span>
              <span className="text-lg font-bold text-primary">
                {Math.max(0, balance - amountValue).toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount || amountValue <= 0 || amountValue > balance}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Encaisser"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
