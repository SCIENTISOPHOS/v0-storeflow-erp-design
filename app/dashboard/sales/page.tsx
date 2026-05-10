"use client"

import { useState } from "react"
import { useProducts } from "@/hooks/useProducts"
import { useClients } from "@/hooks/useClients"
import { useSales } from "@/hooks/useSales"
import { DashboardHeader } from "@/components/dashboard/header"
import { POSInterface } from "@/components/sales/pos-interface"
import { CheckoutModal } from "@/components/sales/checkout-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Loader2, Banknote } from "lucide-react"
import { toast } from "sonner"
import type { Product, CartItem, Client, PaymentMethod } from "@/types"

export default function SalesPage() {
  const { products, loading: productsLoading } = useProducts()
  const { clients, loading: clientsLoading } = useClients()
  const { createSale, getTodayCashTotal } = useSales()

  const [cart, setCart] = useState<CartItem[]>([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const loading = productsLoading || clientsLoading

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error("Stock insuffisant")
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (product && quantity > product.quantity) {
      toast.error("Stock insuffisant")
      return
    }

    setCart((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = () => setCart([])

  const handleCheckout = async (paymentMethod: PaymentMethod, client: Client | null) => {
    try {
      await createSale({
        clientId: client?.id ?? null,
        paymentMethod,
        items: cart,
      })

      const total = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0)
      const clientName = client?.name || "Anonyme"
      const methodLabel = paymentMethod === "cash" ? "Espèces" : "Crédit"

      toast.success(
        `Vente de ${total.toLocaleString("fr-FR")} FCFA enregistrée (${methodLabel}) · ${clientName}`,
      )

      setCart([])
    } catch (error) {
      throw error
    }
  }

  const cartTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0)
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Point de vente" description="Enregistrez vos ventes en espèces ou à crédit">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <Banknote className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Caisse:</span>
            <span className="font-medium">{getTodayCashTotal().toLocaleString("fr-FR")} FCFA</span>
          </div>
          <Button onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0} size="lg">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Passer la commande
            {cartItemCount > 0 && (
              <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs font-bold">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Panier</span>
              <span className="font-bold">{cartTotal.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Caisse du jour</span>
              <span className="font-bold text-primary">
                {getTodayCashTotal().toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <POSInterface
        products={products}
        cart={cart}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        clients={clients}
        onCheckout={handleCheckout}
      />
    </div>
  )
}
