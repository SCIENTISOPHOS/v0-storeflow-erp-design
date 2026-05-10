'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, Trash2, Search, ShoppingCart } from 'lucide-react'
import type { Product, CartItem } from '@/types'

interface POSInterfaceProps {
  products: Product[]
  cart: CartItem[]
  onAddToCart: (product: Product) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveFromCart: (productId: string) => void
  onClearCart: () => void
}

export function POSInterface({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
}: POSInterfaceProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || product.type === typeFilter
    const hasStock = product.qty > 0
    return matchesSearch && matchesType && hasStock
  })

  const cartTotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity, 
    0
  )

  const getCartQuantity = (productId: string) => {
    return cart.find(item => item.product.id === productId)?.quantity || 0
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Produits disponibles</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={typeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={typeFilter === 'Sac' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('Sac')}
                >
                  Sacs
                </Button>
                <Button
                  variant={typeFilter === 'Demi sac' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('Demi sac')}
                >
                  Demi sacs
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredProducts.length === 0 ? (
                <p className="col-span-2 text-center py-8 text-muted-foreground">
                  Aucun produit disponible
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const inCart = getCartQuantity(product.id)
                  const availableQty = product.qty - inCart

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        inCart > 0 ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {product.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Stock: {availableQty}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {product.price.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant={inCart > 0 ? 'default' : 'outline'}
                        onClick={() => onAddToCart(product)}
                        disabled={availableQty <= 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Panier
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearCart}>
                  Vider
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Le panier est vide
              </p>
            ) : (
              <>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.product.price.toLocaleString('fr-FR')} FCFA x {item.quantity}
                          </p>
                          <p className="text-sm font-medium">
                            {(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.qty}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => onRemoveFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Articles</span>
                    <span>{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{cartTotal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
