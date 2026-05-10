'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSubmit: (data: {
    name: string
    phone1: string
    phone2?: string
    creditLimit: number
  }) => Promise<void>
}

export function ClientForm({ open, onOpenChange, client, onSubmit }: ClientFormProps) {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    creditLimit: 0,
  })

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone1: client.phone1,
        phone2: client.phone2 || '',
        creditLimit: client.creditLimit,
      })
    } else {
      setFormData({
        name: '',
        phone1: '',
        phone2: '',
        creditLimit: 0,
      })
    }
  }, [client, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        phone2: formData.phone2 || undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting client:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Modifier le client' : 'Ajouter un client'}
          </DialogTitle>
          <DialogDescription>
            {client 
              ? 'Modifiez les informations du client' 
              : 'Remplissez les informations du nouveau client'}
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
            <Label htmlFor="phone1">Téléphone principal</Label>
            <Input
              id="phone1"
              type="tel"
              value={formData.phone1}
              onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
              placeholder="Ex: +221 77 123 45 67"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone2">Téléphone secondaire (optionnel)</Label>
            <Input
              id="phone2"
              type="tel"
              value={formData.phone2}
              onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
              placeholder="Ex: +221 76 987 65 43"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creditLimit">
              Plafond de crédit (FCFA)
              {!isAdmin && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Modifiable par admin uniquement)
                </span>
              )}
            </Label>
            <Input
              id="creditLimit"
              type="number"
              min="0"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: parseInt(e.target.value) || 0 })}
              required
              disabled={loading || !isAdmin}
            />
            <p className="text-xs text-muted-foreground">
              Montant maximum que le client peut devoir
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {client ? 'Modification...' : 'Ajout...'}
                </>
              ) : (
                client ? 'Modifier' : 'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
