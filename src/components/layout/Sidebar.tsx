'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, Egg, Skull, Package, Wheat, Receipt,
  ShoppingCart, Users, Wallet, Calculator, BarChart3,
  Settings, LogOut, BarChart2, Grid3x3, X,
} from 'lucide-react'
import { useFarmStore } from '@/store/farmStore'
import { useAuthStore } from '@/store/authStore'
import { useRole } from '@/hooks/useRole'
import { getInitials } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/pens',       label: 'Pens',           icon: Grid3x3 },
  { href: '/production', label: 'Production',      icon: Egg },
  { href: '/mortality',  label: 'Mortality',       icon: Skull },
  { href: '/inventory',  label: 'Inventory',       icon: Package },
  { href: '/feed',       label: 'Feed costs',      icon: Wheat },
  { href: '/expenses',   label: 'Expenses',        icon: Receipt },
  { href: '/sales',      label: 'Sales',           icon: ShoppingCart },
  { href: '/workers',    label: 'Workers',         icon: Users },
  { href: '/payroll',    label: 'Payroll',         icon: Wallet },
  { href: '/pricing',    label: 'Pricing engine',  icon: Calculator },
  { href: '/analytics',  label: 'Analytics',       icon: BarChart2 },
  { href: '/reports',    label: 'Reports',         icon: BarChart3 },
  { href: '/settings',   label: 'Settings',        icon: Settings },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { inventory } = useFarmStore()
  const { user, logout } = useAuthStore()
  const { canAccessNav } = useRole()
  const lowStock = inventory.filter(i => i.qty <= i.minQty).length
  const visibleNav = NAV.filter(n => canAccessNav(n.href))

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  function handleNavClick() {
    onClose?.()
  }

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-stone-200 flex flex-col z-40
      transition-transform duration-300
      lg:translate-x-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Logo + mobile close */}
      <div className="px-4 py-4 border-b border-stone-100 flex items-center justify-between">
        <img src="/logo.png" alt="Okesreal Farm" className="h-10 w-auto object-contain flex-1 min-w-0" />
        <button
          onClick={onClose}
          className="lg:hidden ml-2 p-1 rounded-lg hover:bg-stone-100 text-stone-400 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              <Icon size={15} />
              <span>{label}</span>
              {href === '/inventory' && lowStock > 0 && (
                <span className="ml-auto text-[10px] bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 font-medium">
                  {lowStock}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      {user && (
        <div className="p-3 border-t border-stone-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-[11px] font-medium flex-shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-700 truncate">{user.name}</div>
              <div className="text-[10px] text-stone-400">{user.role}</div>
            </div>
            <button onClick={handleLogout} className="text-stone-400 hover:text-red-500 transition-colors" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
          <div className="text-[10px] text-stone-300 text-center">v1.0 MVP</div>
        </div>
      )}
    </aside>
  )
}
