'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle, User, Banknote, CreditCard, Search } from 'lucide-react'
import type { CartItem, Client, PaymentType } from '@/types'

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  clients: Client[]
  onCheckout: (paymentType: PaymentType, client: Client | null) => Promise<void>
}

export function CheckoutModal({
  open,
  onOpenChange,
  cart,
  clients,
  onCheckout,
}: CheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>('Espèces')
  const [clientType, setClientType] = useState<'anonymous' | 'registered'>('anonymous')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSearch, setClientSearch] = useState('')

  const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  
  const selectedClient = clients.find(c => c.id === selectedClientId) || null

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone1.includes(clientSearch)
  )

  // Check if credit is allowed
  const canUseCredit = () => {
    if (clientType === 'anonymous') return false
    if (!selectedClient) return false
    
    const newBalance = selectedClient.creditBalance + total
    return newBalance <= selectedClient.creditLimit
  }

  const getCreditMessage = () => {
    if (clientType === 'anonymous') {
      return 'Le crédit est interdit pour les ventes anonymes'
    }
    if (!selectedClient) {
      return 'Sélectionnez un client pour activer le crédit'
    }
    
    const newBalance = selectedClient.creditBalance + total
    if (newBalance > selectedClient.creditLimit) {
      return `Crédit refusé: Le nouveau solde (${newBalance.toLocaleString('fr-FR')} FCFA) dépasserait le plafond de ${selectedClient.creditLimit.toLocaleString('fr-FR')} FCFA`
    }
    
    return null
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const client = clientType === 'registered' ? selectedClient : null
      await onCheckout(paymentType, client)
      
      // Reset form
      setPaymentType('Espèces')
      setClientType('anonymous')
      setSelectedClientId('')
      setClientSearch('')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleClientTypeChange = (value: 'anonymous' | 'registered') => {
    setClientType(value)
    if (value === 'anonymous') {
      setPaymentType('Espèces')
      setSelectedClientId('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finaliser la vente</DialogTitle>
          <DialogDescription>
            Total: <strong>{total.toLocaleString('fr-FR')} FCFA</strong> | 
            {cart.reduce((acc, item) => acc + item.quantity, 0)} article(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Client Selection */}
          <div className="space-y-3">
            <Label>Type de client</Label>
            <RadioGroup
              value={clientType}
              onValueChange={(v) => handleClientTypeChange(v as 'anonymous' | 'registered')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="anonymous" id="anonymous" />
                <Label htmlFor="anonymous" className="cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Anonyme
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="registered" id="registered" />
                <Label htmlFor="registered" className="cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client enregistré
                </Label>
              </div>
            </RadioGroup>
          </div>

          {clientType === 'registered' && (
            <div className="space-y-3">
              <Label>Sélectionner le client</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou téléphone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un client" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <span>{client.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({client.phone1})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClient && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solde actuel:</span>
                    <span className={selectedClient.creditBalance > 0 ? 'text-destructive font-medium' : ''}>
                      {selectedClient.creditBalance.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plafond:</span>
                    <span>{selectedClient.creditLimit.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Crédit disponible:</span>
                    <span className="font-medium">
                      {(selectedClient.creditLimit - selectedClient.creditBalance).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Payment Type */}
          <div className="space-y-3">
            <Label>Mode de paiement</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(v) => setPaymentType(v as PaymentType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Espèces" id="cash" />
                <Label htmlFor="cash" className="cursor-pointer flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Espèces
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="Crédit" 
                  id="credit" 
                  disabled={!canUseCredit()}
                />
                <Label 
                  htmlFor="credit" 
                  className={`cursor-pointer flex items-center gap-2 ${!canUseCredit() ? 'text-muted-foreground' : ''}`}
                >
                  <CreditCard className="h-4 w-4" />
                  Crédit
                </Label>
              </div>
            </RadioGroup>

            {getCreditMessage() && (
              <Alert variant={paymentType === 'Crédit' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{getCreditMessage()}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex justify-between text-lg font-bold">
              <span>Total à payer</span>
              <span>{total.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>Mode</span>
              <span>{paymentType}</span>
            </div>
            {clientType === 'registered' && selectedClient && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Client</span>
                <span>{selectedClient.name}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (paymentType === 'Crédit' && !canUseCredit())}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              'Confirmer la vente'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
