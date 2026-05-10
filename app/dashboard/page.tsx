'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  TrendingUp,
  CreditCard
} from 'lucide-react'
import type { Product, Client, Sale, DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    salesToday: 0,
    salesAmount: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalClients: 0,
    totalDebt: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get start of today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = Timestamp.fromDate(today)

    // Products listener
    const productsUnsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const products = snapshot.docs.map(doc => doc.data() as Product)
        setStats(prev => ({
          ...prev,
          totalProducts: products.reduce((acc, p) => acc + p.qty, 0),
          lowStockProducts: products.filter(p => p.qty < 5).length,
        }))
      }
    )

    // Clients listener
    const clientsUnsubscribe = onSnapshot(
      collection(db, 'clients'),
      (snapshot) => {
        const clients = snapshot.docs.map(doc => doc.data() as Client)
        setStats(prev => ({
          ...prev,
          totalClients: clients.length,
          totalDebt: clients.reduce((acc, c) => acc + c.creditBalance, 0),
        }))
      }
    )

    // Sales today listener
    const salesUnsubscribe = onSnapshot(
      query(
        collection(db, 'sales'),
        where('timestamp', '>=', todayTimestamp)
      ),
      (snapshot) => {
        const sales = snapshot.docs.map(doc => doc.data() as Sale)
        setStats(prev => ({
          ...prev,
          salesToday: sales.length,
          salesAmount: sales.reduce((acc, s) => acc + s.totalAmount, 0),
        }))
        setLoading(false)
      }
    )

    return () => {
      productsUnsubscribe()
      clientsUnsubscribe()
      salesUnsubscribe()
    }
  }, [])

  const statCards = [
    {
      title: "Ventes aujourd'hui",
      value: stats.salesToday,
      description: `${stats.salesAmount.toLocaleString('fr-FR')} FCFA`,
      icon: ShoppingCart,
      color: 'text-green-600',
    },
    {
      title: 'Stock total',
      value: stats.totalProducts,
      description: 'unités en stock',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Stock faible',
      value: stats.lowStockProducts,
      description: 'produits < 5 unités',
      icon: AlertTriangle,
      color: stats.lowStockProducts > 0 ? 'text-orange-600' : 'text-muted-foreground',
    },
    {
      title: 'Clients',
      value: stats.totalClients,
      description: 'clients enregistrés',
      icon: Users,
      color: 'text-indigo-600',
    },
    {
      title: 'Créances totales',
      value: `${stats.totalDebt.toLocaleString('fr-FR')}`,
      description: 'FCFA à recouvrer',
      icon: CreditCard,
      color: stats.totalDebt > 0 ? 'text-red-600' : 'text-muted-foreground',
    },
    {
      title: 'Performance',
      value: stats.salesToday > 0 ? '+' + stats.salesToday : '0',
      description: 'transactions',
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Tableau de bord" 
        description="Vue d'ensemble de votre activité"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions section */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a 
              href="/dashboard/sales" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Nouvelle vente</p>
                <p className="text-sm text-muted-foreground">Enregistrer une transaction</p>
              </div>
            </a>
            <a 
              href="/dashboard/products" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Gérer le stock</p>
                <p className="text-sm text-muted-foreground">Voir et modifier les produits</p>
              </div>
            </a>
            <a 
              href="/dashboard/clients" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Gérer les clients</p>
                <p className="text-sm text-muted-foreground">Voir les soldes et crédits</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
