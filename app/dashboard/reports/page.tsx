"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useSales } from "@/hooks/useSales"
import { useClients } from "@/hooks/useClients"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Banknote, CreditCard, TrendingUp, Calendar, Clock } from "lucide-react"
import type { AuditLog, AuditAction } from "@/types"

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  SALE: "Vente",
  PAYMENT: "Paiement",
  STOCK_ADJUST: "Stock ajusté",
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
}

export default function ReportsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const { sales, loading: salesLoading, getTodaySales, getTodayTotal, getTodayCashTotal } = useSales()
  const { clients, loading: clientsLoading } = useClients()
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { profiles?: { full_name: string | null } | null })[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/dashboard")
    }
  }, [isAdmin, authLoading, router])

  useEffect(() => {
    if (!isAdmin) return
    const supabase = createClient()
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50)
      setAuditLogs((data ?? []) as never)
      setLogsLoading(false)
    }
    fetchLogs()
  }, [isAdmin])

  const loading = authLoading || salesLoading || clientsLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) return null

  const todaySales = getTodaySales()
  const todayTotal = getTodayTotal()
  const todayCash = getTodayCashTotal()
  const todayCredit = todayTotal - todayCash

  const totalDebt = clients.reduce((acc, c) => acc + Number(c.current_balance), 0)
  const clientsWithDebt = clients.filter((c) => Number(c.current_balance) > 0)

  const formatDateTime = (dateStr: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr))
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Rapports" description="Analyses et clôture de caisse (Admin uniquement)" />

      <Tabs defaultValue="cash" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cash">Clôture de caisse</TabsTrigger>
          <TabsTrigger value="sales">Journal des ventes</TabsTrigger>
          <TabsTrigger value="debts">Créances</TabsTrigger>
          <TabsTrigger value="audit">Journal d&apos;audit</TabsTrigger>
        </TabsList>

        <TabsContent value="cash" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total du jour</CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayTotal.toLocaleString("fr-FR")} FCFA</div>
                <p className="text-xs text-muted-foreground mt-1">{todaySales.length} transaction(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Espèces</CardTitle>
                <Banknote className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {todayCash.toLocaleString("fr-FR")} FCFA
                </div>
                <p className="text-xs text-muted-foreground mt-1">Argent en caisse</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Crédit</CardTitle>
                <CreditCard className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {todayCredit.toLocaleString("fr-FR")} FCFA
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ventes à crédit du jour</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ventes du jour
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Heure</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Vendeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucune vente aujourd&apos;hui
                        </TableCell>
                      </TableRow>
                    ) : (
                      todaySales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="text-sm">{formatTime(sale.created_at)}</TableCell>
                          <TableCell>{sale.clients?.name ?? "Anonyme"}</TableCell>
                          <TableCell>
                            <Badge variant={sale.payment_method === "cash" ? "default" : "secondary"}>
                              {sale.payment_method === "cash" ? "Espèces" : "Crédit"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(sale.total).toLocaleString("fr-FR")} FCFA
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sale.profiles?.full_name ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Historique des ventes</CardTitle>
              <CardDescription>Les 100 dernières transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Articles</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Vendeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-sm">{formatDateTime(sale.created_at)}</TableCell>
                        <TableCell>{sale.clients?.name ?? "Anonyme"}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {sale.sale_items.reduce((acc, item) => acc + item.quantity, 0)} article(s)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.payment_method === "cash" ? "default" : "secondary"}>
                            {sale.payment_method === "cash" ? "Espèces" : "Crédit"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(sale.total).toLocaleString("fr-FR")} FCFA
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sale.profiles?.full_name ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts">
          <Card>
            <CardHeader>
              <CardTitle>Créances clients</CardTitle>
              <CardDescription>
                Total à recouvrer: <strong>{totalDebt.toLocaleString("fr-FR")} FCFA</strong> (
                {clientsWithDebt.length} client(s))
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead className="text-right">Solde dû</TableHead>
                      <TableHead className="text-right">Plafond</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsWithDebt.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucune créance en cours
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientsWithDebt
                        .slice()
                        .sort((a, b) => Number(b.current_balance) - Number(a.current_balance))
                        .map((client) => {
                          const balance = Number(client.current_balance)
                          const limit = Number(client.credit_limit)
                          const percentage = limit > 0 ? (balance / limit) * 100 : 0
                          return (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell>{client.phone ?? "—"}</TableCell>
                              <TableCell className="text-right font-medium text-destructive">
                                {balance.toLocaleString("fr-FR")} FCFA
                              </TableCell>
                              <TableCell className="text-right">{limit.toLocaleString("fr-FR")} FCFA</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    percentage >= 100
                                      ? "destructive"
                                      : percentage >= 80
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {percentage >= 100 ? "Limite atteinte" : `${Math.round(percentage)}%`}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Journal d&apos;audit
              </CardTitle>
              <CardDescription>Traçabilité des actions sensibles (50 dernières)</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Utilisateur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Aucune entrée dans le journal
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">{formatDateTime(log.created_at)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{ACTION_LABELS[log.action] ?? log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-sm font-mono">{log.table_name}</TableCell>
                            <TableCell>{log.profiles?.full_name ?? "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
