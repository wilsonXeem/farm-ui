'use client'
import { useState, useEffect } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import { useFarmStore } from '@/store/farmStore'
import { useAuthStore } from '@/store/authStore'
import { CheckCircle, Loader2 } from 'lucide-react'
import { ROLES } from '@/lib/constants'
import { farmService } from '@/services/farmService'
import { fmt } from '@/lib/utils'

export default function SettingsPage() {
  const { farmSettings } = useFarmStore() as any
  const { user } = useAuthStore()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    location: '',
    totalBirds: 500,
    priceJumbo: 0,
    priceMedium: 0,
    priceTable: 0,
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
  })

  useEffect(() => {
    if (farmSettings) {
      setForm({
        name: farmSettings.name ?? 'Okesreal Farm',
        location: farmSettings.location ?? '',
        totalBirds: farmSettings.totalBirds ?? 500,
        priceJumbo: farmSettings.priceJumbo ?? 0,
        priceMedium: farmSettings.priceMedium ?? 0,
        priceTable: farmSettings.priceTable ?? 0,
        bankName: farmSettings.bankName ?? '',
        bankAccount: farmSettings.bankAccount ?? '',
        bankAccountName: farmSettings.bankAccountName ?? '',
      })
    }
  }, [farmSettings])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await farmService.updateFarmSettings(form)
      useFarmStore.setState({ farmSettings: updated } as any)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell>
      <PageHeader title="Settings" subtitle="Farm configuration and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Farm details */}
          <form onSubmit={handleSave}>
            <div className="card mb-4">
              <div className="section-title">Farm details</div>
              <div className="space-y-3">
                <div className="form-group">
                  <label className="form-label">Farm name</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="input" placeholder="e.g. Lagos, Nigeria" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total birds (flock size)</label>
                  <input type="number" className="input" value={form.totalBirds} min={1} onChange={e => setForm(f => ({ ...f, totalBirds: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            {/* Egg pricing */}
            <div className="card mb-4">
              <div className="section-title">Egg size pricing (price per crate)</div>
              <div className="space-y-3">
                <div className="form-group">
                  <label className="form-label">Jumbo — price per crate (₦)</label>
                  <input type="number" className="input" value={form.priceJumbo} min={0} onChange={e => setForm(f => ({ ...f, priceJumbo: Number(e.target.value) }))} />
                  {form.priceJumbo > 0 && <span className="text-[11px] text-stone-400 mt-1 block">{fmt(form.priceJumbo)}/crate · {fmt(form.priceJumbo / 30)}/piece</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Medium — price per crate (₦)</label>
                  <input type="number" className="input" value={form.priceMedium} min={0} onChange={e => setForm(f => ({ ...f, priceMedium: Number(e.target.value) }))} />
                  {form.priceMedium > 0 && <span className="text-[11px] text-stone-400 mt-1 block">{fmt(form.priceMedium)}/crate · {fmt(form.priceMedium / 30)}/piece</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Table size — price per crate (₦)</label>
                  <input type="number" className="input" value={form.priceTable} min={0} onChange={e => setForm(f => ({ ...f, priceTable: Number(e.target.value) }))} />
                  {form.priceTable > 0 && <span className="text-[11px] text-stone-400 mt-1 block">{fmt(form.priceTable)}/crate · {fmt(form.priceTable / 30)}/piece</span>}
                </div>
              </div>
            </div>

            {/* Bank account */}
            <div className="card mb-4">
              <div className="section-title">Bank account (for invoices)</div>
              <div className="space-y-3">
                <div className="form-group">
                  <label className="form-label">Bank name</label>
                  <input className="input" placeholder="e.g. First Bank" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account number</label>
                  <input className="input" placeholder="e.g. 3012345678" value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account name</label>
                  <input className="input" placeholder="e.g. Okesreal Farm Ltd" value={form.bankAccountName} onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))} />
                </div>
              </div>
            </div>

            {saved && (
              <div className="alert alert-success py-2 mb-3">
                <CheckCircle size={14} /> Settings saved successfully
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Save changes
            </button>
          </form>
        </div>

        {/* Account info + roles */}
        <div className="space-y-4">
          <div className="card">
            <div className="section-title">Account</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-stone-500">Name</span><span className="font-medium">{user?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-stone-500">Email</span><span className="font-medium">{user?.email}</span></div>
              <div className="flex justify-between text-sm"><span className="text-stone-500">Role</span><span className="badge badge-blue">{user?.role}</span></div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Current egg prices</div>
            <div className="space-y-2">
              {[
                { label: 'Jumbo', price: form.priceJumbo },
                { label: 'Medium', price: form.priceMedium },
                { label: 'Table size', price: form.priceTable },
              ].map(({ label, price }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <span className="text-sm text-stone-600">{label}</span>
                  <div className="text-right">
                    <div className={`font-medium text-sm ${price > 0 ? 'text-brand-600' : 'text-stone-300'}`}>
                      {price > 0 ? fmt(price) + '/crate' : 'Not set'}
                    </div>
                    {price > 0 && <div className="text-[11px] text-stone-400">{fmt(price / 30)}/piece</div>}
                  </div>
                </div>
              ))}
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
                    {role === 'Accountant' && 'Sales, payroll, pricing, reports'}
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
