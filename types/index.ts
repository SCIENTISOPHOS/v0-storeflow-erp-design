// User types with RBAC
export type UserRole = 'admin' | 'vendeur'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

// Product types
export type ProductType = 'Sac' | 'Demi sac'

export interface Product {
  id: string
  name: string
  type: ProductType
  qty: number
  price: number
  createdAt: Date
  updatedAt: Date
}

// Client types
export interface Client {
  id: string
  name: string
  phone1: string
  phone2?: string
  creditBalance: number // Current debt
  creditLimit: number // Maximum allowed credit
  createdAt: Date
  updatedAt: Date
}

// Sale types
export type PaymentType = 'Espèces' | 'Crédit'

export interface SaleItem {
  productId: string
  productName: string
  productType: ProductType
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Sale {
  id: string
  clientId: string | null // null for anonymous sales
  clientName: string // 'ANONYME' for anonymous sales
  items: SaleItem[]
  totalAmount: number
  paymentType: PaymentType
  userId: string // Who made the sale
  userName: string
  timestamp: Date
  notes?: string
}

// Audit log for tracking sensitive actions
export type AuditAction = 
  | 'SALE_CREATED'
  | 'SALE_CANCELLED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'CLIENT_DELETED'
  | 'CREDIT_LIMIT_CHANGED'
  | 'PRICE_CHANGED'
  | 'PAYMENT_RECEIVED'

export interface AuditLog {
  id: string
  action: AuditAction
  userId: string
  userName: string
  targetType: 'product' | 'client' | 'sale'
  targetId: string
  details: Record<string, unknown>
  timestamp: Date
}

// Cart for POS
export interface CartItem {
  product: Product
  quantity: number
}

// Dashboard stats
export interface DashboardStats {
  salesToday: number
  salesAmount: number
  totalProducts: number
  lowStockProducts: number
  totalClients: number
  totalDebt: number
}
