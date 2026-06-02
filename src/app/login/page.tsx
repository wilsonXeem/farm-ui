'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Egg } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const { login, loading, error, user, init } = useAuthStore()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => { init() }, [init])
  useEffect(() => { if (user) router.replace('/dashboard') }, [user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mb-3">
            <Egg size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-medium text-stone-900" style={{ fontFamily: 'DM Serif Display, serif' }}>
            PFFMS
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">Poultry Farm Financial Management</p>
        </div>

        <div className="card">
          <h2 className="text-base font-medium text-stone-800 mb-5">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@pffms.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="alert alert-danger py-2 text-xs">{error}</div>
            )}

            <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 card text-xs text-stone-400 space-y-1">
          <div className="font-medium text-stone-500 mb-2">Demo credentials</div>
          <div>Admin: <span className="font-mono">admin@pffms.com</span> / <span className="font-mono">admin123</span></div>
          <div>Manager: <span className="font-mono">manager@pffms.com</span> / <span className="font-mono">manager123</span></div>
          <div>Accountant: <span className="font-mono">accounts@pffms.com</span> / <span className="font-mono">accounts123</span></div>
          <div>Sales: <span className="font-mono">sales@pffms.com</span> / <span className="font-mono">sales123</span></div>
          <div>Staff (Pen 1&2): <span className="font-mono">emeka@pffms.com</span> / <span className="font-mono">emeka123</span></div>
          <div>Staff (Pen 3&4): <span className="font-mono">ngozi@pffms.com</span> / <span className="font-mono">ngozi123</span></div>
          <div>Staff (Pen 5): <span className="font-mono">chidi@pffms.com</span> / <span className="font-mono">chidi123</span></div>
        </div>
      </div>
    </div>
  )
}
