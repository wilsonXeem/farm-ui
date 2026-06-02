'use client'
import { useAuthStore } from '@/store/authStore'
import { useFarmStore } from '@/store/farmStore'

export function useStaffPens() {
  const { user } = useAuthStore()
  const { pens, production, mortality } = useFarmStore()

  const isStaff = user?.role === 'Staff'

  // For staff: only pens assigned to their workerId
  const myPens = isStaff && user?.workerId
    ? pens.filter(p => p.workerId === user.workerId)
    : pens

  const myPenIds = myPens.map(p => p.id)

  // Filter production and mortality to only their pens
  const myProduction = isStaff
    ? production.filter(r => r.penId && myPenIds.includes(r.penId))
    : production

  const myMortality = isStaff
    ? mortality.filter(r => r.penId && myPenIds.includes(r.penId))
    : mortality

  return { myPens, myPenIds, myProduction, myMortality, isStaff }
}
