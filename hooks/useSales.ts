'use client'

import { useState, useEffect } from 'react'
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Sale, SaleItem, CartItem, Client, PaymentType, AuditAction } from '@/types'

export function useSales() {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'sales'), 
      orderBy('timestamp', 'desc'),
      limit(100)
    )
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const salesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as Sale[]
        
        setSales(salesData)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching sales:', err)
        setError('Erreur lors du chargement des ventes')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const createSale = async (
    cart: CartItem[],
    paymentType: PaymentType,
    client: Client | null
  ): Promise<string> => {
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    if (cart.length === 0) {
      throw new Error('Le panier est vide')
    }

    // Calculate total
    const totalAmount = cart.reduce(
      (acc, item) => acc + item.product.price * item.quantity, 
      0
    )

    // Validate credit sale
    if (paymentType === 'Crédit') {
      if (!client) {
        throw new Error('Un client doit être sélectionné pour une vente à crédit')
      }

      // Check credit limit
      const newBalance = client.creditBalance + totalAmount
      if (newBalance > client.creditLimit) {
        throw new Error(
          `Crédit refusé: Le solde après vente (${newBalance.toLocaleString('fr-FR')} FCFA) ` +
          `dépasserait le plafond de ${client.creditLimit.toLocaleString('fr-FR')} FCFA`
        )
      }
    }

    // Validate stock for all items
    for (const item of cart) {
      if (item.quantity > item.product.qty) {
        throw new Error(
          `Stock insuffisant pour "${item.product.name}": ` +
          `${item.product.qty} disponible(s), ${item.quantity} demandé(s)`
        )
      }
    }

    // Create sale items
    const items: SaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productType: item.product.type,
      quantity: item.quantity,
      unitPrice: item.product.price,
      totalPrice: item.product.price * item.quantity,
    }))

    // Use transaction to ensure atomicity
    const saleId = await runTransaction(db, async (transaction) => {
      // 1. Create the sale document
      const saleRef = doc(collection(db, 'sales'))
      const saleData = {
        clientId: client?.id || null,
        clientName: client?.name || 'ANONYME',
        items,
        totalAmount,
        paymentType,
        userId: user.id,
        userName: user.name,
        timestamp: serverTimestamp(),
      }
      transaction.set(saleRef, saleData)

      // 2. Update product quantities
      for (const item of cart) {
        const productRef = doc(db, 'products', item.product.id)
        transaction.update(productRef, {
          qty: item.product.qty - item.quantity,
          updatedAt: serverTimestamp(),
        })
      }

      // 3. Update client credit balance (if credit sale)
      if (paymentType === 'Crédit' && client) {
        const clientRef = doc(db, 'clients', client.id)
        transaction.update(clientRef, {
          creditBalance: client.creditBalance + totalAmount,
          updatedAt: serverTimestamp(),
        })
      }

      // 4. Create audit log
      const auditRef = doc(collection(db, 'audit_logs'))
      transaction.set(auditRef, {
        action: 'SALE_CREATED' as AuditAction,
        userId: user.id,
        userName: user.name,
        targetType: 'sale',
        targetId: saleRef.id,
        details: {
          clientId: client?.id || null,
          clientName: client?.name || 'ANONYME',
          totalAmount,
          paymentType,
          itemCount: items.length,
        },
        timestamp: serverTimestamp(),
      })

      return saleRef.id
    })

    return saleId
  }

  const getTodaySales = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return sales.filter(sale => sale.timestamp >= today)
  }

  const getTodayTotal = () => {
    return getTodaySales().reduce((acc, sale) => acc + sale.totalAmount, 0)
  }

  const getTodayCashTotal = () => {
    return getTodaySales()
      .filter(sale => sale.paymentType === 'Espèces')
      .reduce((acc, sale) => acc + sale.totalAmount, 0)
  }

  return {
    sales,
    loading,
    error,
    createSale,
    getTodaySales,
    getTodayTotal,
    getTodayCashTotal,
  }
}
