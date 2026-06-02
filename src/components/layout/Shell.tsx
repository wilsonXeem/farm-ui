'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useFarmStore } from '@/store/farmStore'
import { getStoredAuth } from '@/lib/auth'
import Sidebar from './Sidebar'

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, init } = useAuthStore()
  const { loadAll } = useFarmStore()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    init()
    const stored = getStoredAuth()
    if (!stored) {
      router.replace('/login')
    }
    setChecked(true)
  }, [init, router])

  useEffect(() => {
    if (user) loadAll()
  }, [user, loadAll])

  if (!checked) return null
  if (!getStoredAuth()) return null

  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar />
      <main className="ml-[220px] min-h-screen">
        <div className="p-6 max-w-7xl mx-auto page-fade">
          {children}
        </div>
      </main>
    </div>
  )
}
