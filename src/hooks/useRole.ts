'use client'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/lib/constants'

const NAV_ACCESS: Record<Role, string[]> = {
  'Admin': [
    '/dashboard', '/pens', '/production', '/mortality', '/stock', '/feed-formula',
    '/expenses', '/sales', '/workers', '/payroll', '/pricing',
    '/analytics', '/reports', '/settings',
  ],
  'Farm Manager': [
    '/dashboard', '/pens', '/production', '/mortality', '/stock', '/feed-formula',
    '/analytics', '/reports',
  ],
  'Accountant': [
    '/dashboard', '/sales', '/workers', '/payroll', '/pricing', '/analytics', '/reports',
  ],
  'Sales': [
    '/dashboard', '/sales', '/expenses',
  ],
  'Staff': [
    '/dashboard', '/pens', '/production', '/mortality',
    '/analytics', '/reports',
  ],
}

export function useRole() {
  const { user } = useAuthStore()
  const storedRole = typeof window !== 'undefined'
    ? (() => { try { const r = localStorage.getItem('pffms-auth'); return r ? JSON.parse(r).role : null } catch { return null } })()
    : null
  const role: Role = (user?.role ?? storedRole ?? 'Admin') as Role

  const isAdmin = role === 'Admin'
  const isStaff = role === 'Staff'
  const isSales = role === 'Sales'

  const can = {
    writeProduction: role === 'Admin' || role === 'Farm Manager' || role === 'Staff',
    writeMortality:  role === 'Admin' || role === 'Farm Manager' || role === 'Staff',
    deleteProduction: role === 'Admin' || role === 'Farm Manager',
    deleteMortality:  role === 'Admin' || role === 'Farm Manager',
    writeInventory:  role === 'Admin' || role === 'Farm Manager',
    writeFeed:       role === 'Admin' || role === 'Farm Manager',
    writeExpenses:   role === 'Admin' || role === 'Sales',
    writeSales:      role === 'Admin' || role === 'Sales' || role === 'Accountant',
    writeWorkers:    role === 'Admin',
    writePayroll:    role === 'Admin' || role === 'Accountant',
    viewSettings:    role === 'Admin',
  }

  function canAccessNav(href: string) {
    return NAV_ACCESS[role]?.includes(href) ?? false
  }

  return { role, isAdmin, isStaff, isSales, can, canAccessNav }
}
