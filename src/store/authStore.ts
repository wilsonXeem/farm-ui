'use client'
import { create } from 'zustand'
import { login as authLogin, logout as authLogout, getStoredAuth, type AuthUser } from '@/lib/auth'
import { useFarmStore } from '@/store/farmStore'

interface AuthStore {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  init: () => {
    const user = getStoredAuth()
    set({ user })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const user = await authLogin(email, password)
      // Reset farm data so it reloads for the new user
      useFarmStore.setState({ loaded: false, pens: [], production: [], mortality: [], inventory: [], feed: [], expenses: [], sales: [], workers: [], payroll: [] })
      set({ user, loading: false })
      return true
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
      return false
    }
  },

  logout: () => {
    authLogout()
    useFarmStore.setState({ loaded: false, pens: [], production: [], mortality: [], inventory: [], feed: [], expenses: [], sales: [], workers: [], payroll: [] })
    set({ user: null })
  },
}))
