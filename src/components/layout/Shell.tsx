'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFarmStore } from '@/store/farmStore'
import { getStoredAuth } from '@/lib/auth'
import Sidebar from './Sidebar'
import PageLoader from '../ui/PageLoader'

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, init } = useAuthStore()
  const { loadAll, loaded } = useFarmStore()
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    init()
    const stored = getStoredAuth()
    if (!stored) router.replace('/login')
    setChecked(true)
  }, [init, router])

  useEffect(() => {
    if (user) loadAll()
  }, [user, loadAll])

  if (!checked) return null
  if (!getStoredAuth()) return null

  return (
    <div className="min-h-screen bg-stone-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[220px] min-h-screen">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
            <Menu size={20} className="text-stone-600" />
          </button>
          <img src="/logo.png" alt="Okesreal Farm" className="h-7 w-auto object-contain" />
        </div>

        <div className="p-4 lg:p-6 max-w-7xl mx-auto page-fade">
          {!loaded ? <PageLoader /> : children}
        </div>
      </main>
    </div>
  )
}
