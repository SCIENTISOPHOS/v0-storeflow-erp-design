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
import type { Client } from '@/types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const clientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Client[]
        
        setClients(clientsData)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching clients:', err)
        setError('Erreur lors du chargement des clients')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addClient = async (data: {
    name: string
    phone1: string
    phone2?: string
    creditLimit: number
  }) => {
    try {
      await addDoc(collection(db, 'clients'), {
        ...data,
        creditBalance: 0, // New clients start with no debt
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error adding client:', err)
      throw new Error('Erreur lors de l\'ajout du client')
    }
  }

  const updateClient = async (id: string, data: Partial<Client>) => {
    try {
      const clientRef = doc(db, 'clients', id)
      await updateDoc(clientRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error updating client:', err)
      throw new Error('Erreur lors de la mise à jour du client')
    }
  }

  const deleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id))
    } catch (err) {
      console.error('Error deleting client:', err)
      throw new Error('Erreur lors de la suppression du client')
    }
  }

  const updateCreditBalance = async (id: string, amount: number) => {
    const client = clients.find(c => c.id === id)
    if (!client) {
      throw new Error('Client non trouvé')
    }
    
    const newBalance = client.creditBalance + amount
    if (newBalance < 0) {
      throw new Error('Le solde ne peut pas être négatif')
    }
    
    await updateClient(id, { creditBalance: newBalance })
  }

  const receivePayment = async (id: string, amount: number) => {
    const client = clients.find(c => c.id === id)
    if (!client) {
      throw new Error('Client non trouvé')
    }
    
    if (amount > client.creditBalance) {
      throw new Error('Le paiement dépasse le solde dû')
    }
    
    const newBalance = client.creditBalance - amount
    await updateClient(id, { creditBalance: newBalance })
  }

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    updateCreditBalance,
    receivePayment,
  }
}
