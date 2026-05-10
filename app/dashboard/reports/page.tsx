'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSales } from '@/hooks/useSales'
import { useClients } from '@/hooks/useClients'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Loader2, 
  Banknote, 
  CreditCard, 
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AuditLog } from '@/types'

export default function ReportsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const { sales, loading: salesLoading, getTodaySales, getTodayTotal, getTodayCashTotal } = useSales()
  const { clients, loading: clientsLoading } = useClients()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, authLoading, router])

  // Fetch audit logs
  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as AuditLog[]
      setAuditLogs(logs)
      setLogsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loading = authLoading || salesLoading || clientsLoading || logsLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const todaySales = getTodaySales()
  const todayTotal = getTodayTotal()
  const todayCash = getTodayCashTotal()
  const todayCredit = todayTotal - todayCash

  const totalDebt = clients.reduce((acc, c) => acc + c.creditBalance, 0)
  const clientsWithDebt = clients.filter(c => c.creditBalance > 0)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'SALE_CREATED': 'Vente créée',
      'SALE_CANCELLED': 'Vente annulée',
      'PRODUCT_CREATED': 'Produit ajouté',
      'PRODUCT_UPDATED': 'Produit modifié',
      'PRODUCT_DELETED': 'Produit supprimé',
      'CLIENT_CREATED': 'Client ajouté',
      'CLIENT_UPDATED': 'Client modifié',
      'CLIENT_DELETED': 'Client supprimé',
      'CREDIT_LIMIT_CHANGED': 'Plafond modifié',
      'PRICE_CHANGED': 'Prix modifié',
      'PAYMENT_RECEIVED': 'Paiement reçu',
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Rapports" 
        description="Analyses et clôture de caisse (Admin uniquement)"
      />

      <Tabs defaultValue="cash" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cash">Clôture de caisse</TabsTrigger>
          <TabsTrigger value="sales">Journal des ventes</TabsTrigger>
          <TabsTrigger value="debts">Créances</TabsTrigger>
          <TabsTrigger value="audit">Journal d&apos;audit</TabsTrigger>
        </TabsList>

        {/* Cash Register Tab */}
        <TabsContent value="cash" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total du jour
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {todayTotal.toLocaleString('fr-FR')} FCFA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todaySales.length} transaction(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Espèces
                </CardTitle>
                <Banknote className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {todayCash.toLocaleString('fr-FR')} FCFA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Argent en caisse
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Crédit
                </CardTitle>
                <CreditCard className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {todayCredit.toLocaleString('fr-FR')} FCFA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ventes à crédit du jour
                </p>
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
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
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
                          <TableCell className="text-sm">
                            {sale.timestamp.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>{sale.clientName}</TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentType === 'Espèces' ? 'default' : 'secondary'}>
                              {sale.paymentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {sale.totalAmount.toLocaleString('fr-FR')} FCFA
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sale.userName}
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

        {/* Sales Journal Tab */}
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
                        <TableCell className="text-sm">
                          {formatDate(sale.timestamp)}
                        </TableCell>
                        <TableCell>{sale.clientName}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {sale.items.reduce((acc, item) => acc + item.quantity, 0)} article(s)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.paymentType === 'Espèces' ? 'default' : 'secondary'}>
                            {sale.paymentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {sale.totalAmount.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sale.userName}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debts Tab */}
        <TabsContent value="debts">
          <Card>
            <CardHeader>
              <CardTitle>Créances clients</CardTitle>
              <CardDescription>
                Total à recouvrer: <strong>{totalDebt.toLocaleString('fr-FR')} FCFA</strong> 
                {' '}({clientsWithDebt.length} client(s))
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
                        .sort((a, b) => b.creditBalance - a.creditBalance)
                        .map((client) => {
                          const percentage = (client.creditBalance / client.creditLimit) * 100
                          return (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell>{client.phone1}</TableCell>
                              <TableCell className="text-right font-medium text-destructive">
                                {client.creditBalance.toLocaleString('fr-FR')} FCFA
                              </TableCell>
                              <TableCell className="text-right">
                                {client.creditLimit.toLocaleString('fr-FR')} FCFA
                              </TableCell>
                              <TableCell>
                                <Badge variant={percentage >= 100 ? 'destructive' : percentage >= 80 ? 'default' : 'secondary'}>
                                  {percentage >= 100 ? 'Bloqué' : `${Math.round(percentage)}%`}
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

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Journal d&apos;audit
              </CardTitle>
              <CardDescription>
                Traçabilité des actions sensibles (50 dernières)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Détails</TableHead>
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
                          <TableCell className="text-sm">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getActionLabel(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.userName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {JSON.stringify(log.details)}
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
      </Tabs>
    </div>
  )
}
