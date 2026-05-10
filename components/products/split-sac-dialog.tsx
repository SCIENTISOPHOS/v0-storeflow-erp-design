"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Scissors, ArrowRight } from "lucide-react"
import { type Product, SAC_DIVISIBILITY } from "@/types"

interface SplitSacDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sac: Product | null
  onConfirm: (sacId: string, divisibility: number) => Promise<void>
}

export function SplitSacDialog({ open, onOpenChange, sac, onConfirm }: SplitSacDialogProps) {
  const [divisibility, setDivisibility] = useState<number>(SAC_DIVISIBILITY)
  const [loading, setLoading] = useState(false)

  if (!sac) return null

  const sacPrice = Number(sac.price)
  const rawHalfPrice = sacPrice / 2
  const previewPrice = Math.max(divisibility, Math.round(rawHalfPrice / divisibility) * divisibility)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm(sac.id, divisibility)
      onOpenChange(false)
      setDivisibility(SAC_DIVISIBILITY)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Couper un sac
          </DialogTitle>
          <DialogDescription>
            Cette action retire 1 sac du stock et ajoute 2 demi-sacs liés au produit parent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground">Sac original</p>
                <p className="font-semibold">{sac.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{sac.sku}</p>
                <p className="mt-2 text-sm font-medium">{sacPrice.toLocaleString("fr-FR")} FCFA</p>
                <p className="text-xs text-muted-foreground">Stock: {sac.quantity}</p>
              </div>

              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />

              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground">2 demi-sacs</p>
                <p className="font-semibold">{sac.name} (1/2)</p>
                <p className="font-mono text-xs text-muted-foreground">{sac.sku}-DS</p>
                <p className="mt-2 text-sm font-medium">{previewPrice.toLocaleString("fr-FR")} FCFA</p>
                <p className="text-xs text-muted-foreground">+2 unités</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="divisibility">Pas d&apos;arrondi du prix (FCFA)</Label>
            <Input
              id="divisibility"
              type="number"
              min="1"
              step="1"
              value={divisibility}
              onChange={(e) => setDivisibility(Math.max(1, Number.parseInt(e.target.value) || SAC_DIVISIBILITY))}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Le prix du demi-sac sera arrondi au multiple le plus proche (par défaut {SAC_DIVISIBILITY}).
              Prix calculé: {rawHalfPrice.toLocaleString("fr-FR")} → arrondi à {previewPrice.toLocaleString("fr-FR")} FCFA.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading || sac.quantity < 1}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Découpe...
              </>
            ) : (
              <>
                <Scissors className="mr-2 h-4 w-4" />
                Confirmer la coupe
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
