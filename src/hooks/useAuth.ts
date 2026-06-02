'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/lib/constants'

export function useAuth(requiredRoles?: Role[]) {
  const { user, init } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (user === null) return
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      router.replace('/dashboard')
    }
  }, [user, requiredRoles, router])

  return { user }
}
