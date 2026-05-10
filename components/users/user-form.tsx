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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { UserRole } from "@/types"
import { ROLE_LABELS } from "@/types"

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user?: {
    id: string
    email: string
    full_name: string | null
    role: UserRole
  }
}

export function UserForm({ open, onOpenChange, onSuccess, user }: UserFormProps) {
  const isEdit = !!user
  const [fullName, setFullName] = useState(user?.full_name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>(user?.role ?? "vendeur")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const url = isEdit ? `/api/admin/users/${user.id}` : "/api/admin/users"
      const method = isEdit ? "PATCH" : "POST"
      const body: Record<string, unknown> = { full_name: fullName, role }
      if (!isEdit) {
        body.email = email
        body.password = password
      } else if (password) {
        body.password = password
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Erreur lors de l'opération")
      }

      toast.success(isEdit ? "Utilisateur modifié" : "Utilisateur créé avec succès")
      onSuccess()
      onOpenChange(false)
      // Reset
      if (!isEdit) {
        setFullName("")
        setEmail("")
        setPassword("")
        setRole("vendeur")
      } else {
        setPassword("")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations de cet utilisateur."
              : "Créez un nouveau compte utilisateur. Le compte sera immédiatement actif."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jean Dupont"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="utilisateur@email.com"
              required
              disabled={loading || isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                {"L'email ne peut pas être modifié."}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEdit ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Laisser vide pour ne pas modifier" : "Min. 6 caractères"}
              required={!isEdit}
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={loading}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendeur">{ROLE_LABELS.vendeur}</SelectItem>
                <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "admin"
                ? "Accès complet : produits, rapports, gestion des utilisateurs."
                : "Accès limité : ventes, clients, consultation des produits."}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
