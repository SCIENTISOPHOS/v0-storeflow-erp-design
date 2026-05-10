"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Trash2, Plus, Minus, Search, Scissors } from "lucide-react"
import { type Product, PRODUCT_TYPE_LABELS, type ProductType } from "@/types"

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => Promise<void>
  onAdjustStock: (id: string, newQuantity: number) => Promise<void>
  onSplitSac: (product: Product) => void
}

export function ProductTable({ products, onEdit, onDelete, onAdjustStock, onSplitSac }: ProductTableProps) {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || product.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const handleStockAdjust = async (product: Product, delta: number) => {
    const newQty = product.quantity + delta
    if (newQty >= 0) {
      await onAdjustStock(product.id, newQty)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("all")}
          >
            Tous
          </Button>
          <Button
            variant={typeFilter === "sac" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("sac")}
          >
            Sacs
          </Button>
          <Button
            variant={typeFilter === "demi_sac" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("demi_sac")}
          >
            Demi-sacs
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Quantité</TableHead>
              <TableHead className="text-right">Prix (FCFA)</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun produit trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const isLow = product.quantity <= product.min_stock
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PRODUCT_TYPE_LABELS[product.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 bg-transparent"
                          onClick={() => handleStockAdjust(product, -1)}
                          disabled={product.quantity <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className={`min-w-[3rem] text-center font-medium ${isLow ? "text-orange-600" : ""}`}>
                          {product.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 bg-transparent"
                          onClick={() => handleStockAdjust(product, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {isLow && (
                        <Badge variant="destructive" className="mt-1 block text-center text-xs">
                          Stock faible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(product.price).toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          {product.type === "sac" && (
                            <DropdownMenuItem
                              onClick={() => onSplitSac(product)}
                              disabled={product.quantity < 1}
                            >
                              <Scissors className="mr-2 h-4 w-4" />
                              Couper un sac
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(product.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
