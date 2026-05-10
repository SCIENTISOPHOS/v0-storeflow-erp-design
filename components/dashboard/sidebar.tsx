"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ROLE_LABELS } from "@/types"

const navItems = [
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { title: "Produits", href: "/dashboard/products", icon: Package, adminOnly: false },
  { title: "Clients", href: "/dashboard/clients", icon: Users, adminOnly: false },
  { title: "Point de vente", href: "/dashboard/sales", icon: ShoppingCart, adminOnly: false },
  { title: "Rapports", href: "/dashboard/reports", icon: FileText, adminOnly: true },
  { title: "Utilisateurs", href: "/dashboard/users", icon: UserCog, adminOnly: true },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { profile, signOut, isAdmin } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-lg text-sidebar-foreground">StoreFlow</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && profile && (
          <div className="mb-3">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile.full_name ?? profile.email}
            </p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={signOut}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent",
            !collapsed && "w-full justify-start",
          )}
          title={collapsed ? "Deconnexion" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Déconnexion</span>}
        </Button>
      </div>
    </aside>
  )
}
