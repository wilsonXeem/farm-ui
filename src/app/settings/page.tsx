'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import { useFarmStore } from '@/store/farmStore'
import { useAuthStore } from '@/store/authStore'
import { CheckCircle } from 'lucide-react'
import { ROLES } from '@/lib/constants'

export default function SettingsPage() {
  const { totalBirds } = useFarmStore()
  const { user } = useAuthStore()
  const [birds, setBirds] = useState(totalBirds)
  const [farmName, setFarmName] = useState('My Poultry Farm')
  const [location, setLocation] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // When backend is ready, persist via API. For now update store.
    useFarmStore.setState({ totalBirds: birds })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Shell>
      <PageHeader title="Settings" subtitle="Farm configuration and preferences" />

      <div className="grid grid-cols-2 gap-4">
        {/* Farm settings */}
        <div className="card">
          <div className="section-title">Farm details</div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Farm name</label>
              <input className="input" value={farmName} onChange={e => setFarmName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="input" placeholder="e.g. Lagos, Nigeria" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Total birds (flock size)</label>
              <input type="number" className="input" value={birds} min={1} onChange={e => setBirds(Number(e.target.value))} />
              <span className="text-[11px] text-stone-400 mt-1">Used to calculate available birds after mortality</span>
            </div>

            {saved && (
              <div className="alert alert-success py-2">
                <CheckCircle size={14} /> Settings saved successfully
              </div>
            )}

            <button type="submit" className="btn btn-primary">Save changes</button>
          </form>
        </div>

        {/* Account info */}
        <div className="space-y-4">
          <div className="card">
            <div className="section-title">Account</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Name</span>
                <span className="font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Role</span>
                <span className="badge badge-blue">{user?.role}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Role permissions</div>
            <div className="space-y-2">
              {ROLES.map(role => (
                <div key={role} className="flex items-center justify-between text-sm py-1 border-b border-stone-50 last:border-0">
                  <span className="text-stone-600">{role}</span>
                  <span className="text-[11px] text-stone-400">
                    {role === 'Admin' && 'Full access'}
                    {role === 'Farm Manager' && 'Pens, production, mortality, inventory, feed'}
                    {role === 'Accountant' && 'Payroll, pricing, reports'}
                    {role === 'Sales' && 'Sales and expenses only'}
                    {role === 'Staff' && 'Their assigned pen(s) only'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
