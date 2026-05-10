'use client'

import { useState, useEffect } from 'react'
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Product, ProductType } from '@/types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Product[]
        
        setProducts(productsData)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching products:', err)
        setError('Erreur lors du chargement des produits')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addProduct = async (data: {
    name: string
    type: ProductType
    qty: number
    price: number
  }) => {
    try {
      await addDoc(collection(db, 'products'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error adding product:', err)
      throw new Error('Erreur lors de l\'ajout du produit')
    }
  }

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      const productRef = doc(db, 'products', id)
      await updateDoc(productRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error updating product:', err)
      throw new Error('Erreur lors de la mise à jour du produit')
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id))
    } catch (err) {
      console.error('Error deleting product:', err)
      throw new Error('Erreur lors de la suppression du produit')
    }
  }

  const updateStock = async (id: string, newQty: number) => {
    if (newQty < 0) {
      throw new Error('La quantité ne peut pas être négative')
    }
    await updateProduct(id, { qty: newQty })
  }

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
  }
}
