"use client"

import { useProducts } from "@/hooks/useProducts"
import { useClients } from "@/hooks/useClients"
import { useSales } from "@/hooks/useSales"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Loader2,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { products, loading: productsLoading } = useProducts()
  const { clients, loading: clientsLoading } = useClients()
  const { getTodaySales, getTodayTotal, loading: salesLoading } = useSales()

  const loading = productsLoading || clientsLoading || salesLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const todaySales = getTodaySales()
  const todayTotal = getTodayTotal()
  const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0)
  const lowStockCount = products.filter((p) => p.quantity <= p.min_stock).length
  const totalDebt = clients.reduce((acc, c) => acc + Number(c.current_balance), 0)

  const statCards = [
    {
      title: "Ventes aujourd'hui",
      value: todaySales.length,
      description: `${todayTotal.toLocaleString("fr-FR")} FCFA`,
      icon: ShoppingCart,
      color: "text-primary",
    },
    {
      title: "Stock total",
      value: totalUnits,
      description: "unités en stock",
      icon: Package,
      color: "text-foreground",
    },
    {
      title: "Stock faible",
      value: lowStockCount,
      description: "produits sous le minimum",
      icon: AlertTriangle,
      color: lowStockCount > 0 ? "text-destructive" : "text-muted-foreground",
    },
    {
      title: "Clients",
      value: clients.length,
      description: "clients enregistrés",
      icon: Users,
      color: "text-foreground",
    },
    {
      title: "Créances totales",
      value: `${totalDebt.toLocaleString("fr-FR")}`,
      description: "FCFA à recouvrer",
      icon: CreditCard,
      color: totalDebt > 0 ? "text-destructive" : "text-muted-foreground",
    },
    {
      title: "Performance",
      value: todaySales.length > 0 ? `+${todaySales.length}` : "0",
      description: "transactions",
      icon: TrendingUp,
      color: "text-primary",
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader title="Tableau de bord" description="Vue d'ensemble de votre activité" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/dashboard/sales"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Nouvelle vente</p>
                <p className="text-sm text-muted-foreground">Enregistrer une transaction</p>
              </div>
            </Link>
            <Link
              href="/dashboard/products"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Gérer le stock</p>
                <p className="text-sm text-muted-foreground">Voir et modifier les produits</p>
              </div>
            </Link>
            <Link
              href="/dashboard/clients"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Gérer les clients</p>
                <p className="text-sm text-muted-foreground">Voir les soldes et crédits</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
