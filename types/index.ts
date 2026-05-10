// Database types matching Supabase schema (snake_case)

export type UserRole = "admin" | "vendeur"
export type ProductType = "sac" | "demi_sac"
export type PaymentMethod = "cash" | "credit"
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SALE"
  | "PAYMENT"
  | "STOCK_ADJUST"
  | "LOGIN"
  | "LOGOUT"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// Alias for compatibility
export type UserProfile = Profile

// Inputs
export interface ProductInput {
  name: string
  type: ProductType
  sku: string
  price: number
  quantity: number
  min_stock?: number
  description?: string | null
  is_active?: boolean
}

export interface ClientInput {
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  credit_limit: number
  notes?: string | null
}

// Sale with relations expanded (used in queries with select)
export interface SaleWithItems {
  id: string
  client_id: string | null
  user_id: string
  payment_method: PaymentMethod
  subtotal: number
  discount: number
  total: number
  amount_paid: number
  notes: string | null
  created_at: string
  sale_items: SaleItem[]
  clients?: { name: string } | null
  profiles?: { full_name: string | null } | null
}

export interface Product {
  id: string
  name: string
  type: ProductType
  sku: string
  price: number
  quantity: number
  min_stock: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  credit_limit: number
  current_balance: number
  is_blocked: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  client_id: string | null
  user_id: string
  payment_method: PaymentMethod
  subtotal: number
  discount: number
  total: number
  amount_paid: number
  notes: string | null
  created_at: string
  // Relations
  client?: Client | null
  user?: Profile | null
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export interface Payment {
  id: string
  client_id: string
  user_id: string
  amount: number
  notes: string | null
  created_at: string
  client?: Client
  user?: Profile
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: AuditAction
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  user?: Profile | null
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

// Helper labels for UI
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  sac: "Sac",
  demi_sac: "Demi-sac",
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  credit: "Crédit",
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  vendeur: "Vendeur",
}
