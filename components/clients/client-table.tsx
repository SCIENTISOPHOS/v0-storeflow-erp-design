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
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { MoreHorizontal, Pencil, Trash2, CreditCard, Phone, Search, Lock, Unlock } from "lucide-react"
import type { Client } from "@/types"

interface ClientTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (id: string) => Promise<void>
  onPayment: (client: Client) => void
  onToggleBlock: (id: string, isBlocked: boolean) => Promise<void>
}

export function ClientTable({ clients, onEdit, onDelete, onPayment, onToggleBlock }: ClientTableProps) {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredClients = clients.filter((client) => {
    const searchLower = search.toLowerCase()
    return (
      client.name.toLowerCase().includes(searchLower) ||
      (client.phone && client.phone.includes(search)) ||
      (client.email && client.email.toLowerCase().includes(searchLower))
    )
  })

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const getCreditStatus = (client: Client) => {
    if (client.is_blocked) return { label: "Bloqué", variant: "destructive" as const }
    if (Number(client.credit_limit) === 0) return { label: "Sans crédit", variant: "secondary" as const }
    const percentage = (Number(client.current_balance) / Number(client.credit_limit)) * 100
    if (percentage >= 100) return { label: "Limite atteinte", variant: "destructive" as const }
    if (percentage >= 80) return { label: "Limite proche", variant: "default" as const }
    return { label: "OK", variant: "secondary" as const }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, téléphone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Solde dû (FCFA)</TableHead>
              <TableHead className="text-right">Plafond (FCFA)</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun client trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const status = getCreditStatus(client)
                const balance = Number(client.current_balance)
                const limit = Number(client.credit_limit)
                const creditPercentage = limit > 0 ? Math.min((balance / limit) * 100, 100) : 0

                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {client.is_blocked && <Lock className="h-3 w-3 text-destructive" />}
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={balance > 0 ? "text-destructive font-medium" : ""}>
                        {balance.toLocaleString("fr-FR")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{limit.toLocaleString("fr-FR")}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {limit > 0 && <Progress value={creditPercentage} className="h-1.5" />}
                      </div>
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
                          {balance > 0 && (
                            <>
                              <DropdownMenuItem onClick={() => onPayment(client)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Encaisser paiement
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => onEdit(client)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => onToggleBlock(client.id, !client.is_blocked)}>
                              {client.is_blocked ? (
                                <>
                                  <Unlock className="mr-2 h-4 w-4" />
                                  Débloquer
                                </>
                              ) : (
                                <>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Bloquer
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(client.id)}
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
              Cette action est irréversible. Le client et son historique seront définitivement supprimés.
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
