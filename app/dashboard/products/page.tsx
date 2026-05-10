"use client"

import { useState } from "react"
import { useProducts } from "@/hooks/useProducts"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardHeader } from "@/components/dashboard/header"
import { ProductTable } from "@/components/products/product-table"
import { ProductForm } from "@/components/products/product-form"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Product, ProductInput } from "@/types"

export default function ProductsPage() {
  const { products, loading, addProduct, updateProduct, deleteProduct, adjustStock } = useProducts()
  const { isAdmin } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleSubmit = async (data: ProductInput) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
        toast.success("Produit modifié avec succès")
      } else {
        await addProduct(data)
        toast.success("Produit ajouté avec succès")
      }
      setEditingProduct(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
      throw error
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      toast.success("Produit supprimé avec succès")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  const handleAdjustStock = async (id: string, newQty: number) => {
    try {
      await adjustStock(id, newQty)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur stock")
    }
  }

  const handleOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditingProduct(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0)

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Gestion des produits"
        description={`${products.length} produits · ${totalUnits} unités en stock`}
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
        onAdjustStock={handleAdjustStock}
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
