import { AUTH_KEY } from './constants'
import type { Role } from './constants'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  farmId: string | null
  workerId: string | null
  token: string
}

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

// Mock users — used when NEXT_PUBLIC_API_URL is not set
const MOCK_USERS: (Omit<AuthUser, 'token'> & { password: string })[] = [
  { id: '1', name: 'Admin User',   email: 'admin@pffms.com',    password: 'admin123',    role: 'Admin',        farmId: 'farm-1', workerId: null },
  { id: '2', name: 'Farm Manager', email: 'manager@pffms.com',  password: 'manager123',  role: 'Farm Manager', farmId: 'farm-1', workerId: null },
  { id: '3', name: 'Accountant',   email: 'accounts@pffms.com', password: 'accounts123', role: 'Accountant',   farmId: 'farm-1', workerId: null },
  { id: '4', name: 'Staff Member', email: 'staff@pffms.com',    password: 'staff123',    role: 'Staff',        farmId: 'farm-1', workerId: null },
]

function mockToken(userId: string) {
  return btoa(`pffms:${userId}:${Date.now()}`)
}

const ROLE_MAP: Record<string, Role> = {
  ADMIN: 'Admin',
  FARM_MANAGER: 'Farm Manager',
  ACCOUNTANT: 'Accountant',
  SALES: 'Sales',
  STAFF: 'Staff',
}

export async function login(email: string, password: string): Promise<AuthUser> {
  if (API) {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? 'Invalid credentials')
    }
    const data = await res.json()
    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name ?? email.split('@')[0],
      email,
      role: (ROLE_MAP[data.user.role] ?? data.user.role) as Role,
      farmId: data.user.farmId ?? 'demo-farm-001',
      workerId: data.user.workerId ?? null,
      token: data.access_token,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
    return authUser
  }

  // Mock fallback
  const user = MOCK_USERS.find(u => u.email === email && u.password === password)
  if (!user) throw new Error('Invalid email or password')
  const { password: _, ...rest } = user
  const authUser: AuthUser = { ...rest, token: mockToken(user.id) }
  localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
  return authUser
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function getStoredAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function hasRole(user: AuthUser | null, ...roles: Role[]): boolean {
  return !!user && roles.includes(user.role)
}
