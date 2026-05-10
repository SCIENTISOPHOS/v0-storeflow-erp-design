'use client'

import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardHeader } from '@/components/dashboard/header'
import { ProductTable } from '@/components/products/product-table'
import { ProductForm } from '@/components/products/product-form'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Product, ProductType } from '@/types'

export default function ProductsPage() {
  const { products, loading, addProduct, updateProduct, deleteProduct, updateStock } = useProducts()
  const { isAdmin } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleSubmit = async (data: {
    name: string
    type: ProductType
    qty: number
    price: number
  }) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
        toast.success('Produit modifié avec succès')
      } else {
        await addProduct(data)
        toast.success('Produit ajouté avec succès')
      }
      setEditingProduct(null)
    } catch (error) {
      toast.error('Une erreur est survenue')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      toast.success('Produit supprimé avec succès')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleUpdateStock = async (id: string, newQty: number) => {
    try {
      await updateStock(id, newQty)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock')
    }
  }

  const handleOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingProduct(null)
    }
  }

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
        title="Gestion des produits" 
        description={`${products.length} produits en stock`}
      >
        {isAdmin && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        )}
      </DashboardHeader>

      <ProductTable
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateStock={handleUpdateStock}
      />

      <ProductForm
        open={formOpen}
        onOpenChange={handleOpenChange}
        product={editingProduct}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
