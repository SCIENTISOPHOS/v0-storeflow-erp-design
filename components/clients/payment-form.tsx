'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import type { Client } from '@/types'

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSubmit: (clientId: string, amount: number) => Promise<void>
}

export function PaymentForm({ open, onOpenChange, client, onSubmit }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    setLoading(true)
    try {
      await onSubmit(client.id, parseInt(amount) || 0)
      setAmount('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error processing payment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!client) return null

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
                {client.creditBalance.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant du paiement (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={client.creditBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant reçu en espèces"
              required
              disabled={loading}
            />
            {parseInt(amount) > client.creditBalance && (
              <p className="text-xs text-destructive">
                Le montant ne peut pas dépasser le solde dû
              </p>
            )}
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Nouveau solde:</span>
              <span className="text-lg font-bold text-green-600">
                {(client.creditBalance - (parseInt(amount) || 0)).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !amount || parseInt(amount) > client.creditBalance}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Encaisser'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
