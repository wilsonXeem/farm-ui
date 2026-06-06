'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmt, today, getInitials } from '@/lib/utils'
import { Plus, Loader2 } from 'lucide-react'

const initForm = { name: '', role: '', salary: '', phone: '' }

export default function WorkersPage() {
  const { workers, addWorker, deleteWorker } = useFarmStore()
  const { can } = useRole()
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const totalSalary = workers.reduce((s, w) => s + w.salary, 0)

  async function handleAdd() {
    if (!form.name || !form.salary) return
    setSaving(true)
    try {
      await addWorker({ name: form.name, role: form.role, salary: Number(form.salary), phone: form.phone, employedDate: today() })
      setForm(initForm)
    } finally { setSaving(false) }
  }

  return (
    <Shell>
      <PageHeader title="Workers" subtitle="Staff management and salary information" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total staff</div><div className="kpi-value">{workers.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Monthly salary bill</div><div className="kpi-value text-red-500">{fmt(totalSalary)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Annual cost</div><div className="kpi-value">{fmt(totalSalary * 12)}</div></div>
      </div>

      {can.writeWorkers && (
      <div className="card mb-4">
        <div className="section-title">Add worker</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Full name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Role</label><input className="input" placeholder="e.g. Feed attendant" value={form.role} onChange={e => set('role', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Monthly salary (₦)</label><input type="number" className="input" value={form.salary} onChange={e => set('salary', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add worker
        </button>
      </div>
      )}

      <div className="card">
        <div className="section-title">Staff list</div>
        {workers.length === 0 ? <EmptyState /> : (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Salary</th><th>Phone</th><th>Employed</th><th></th></tr></thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {getInitials(w.name)}
                      </div>
                      <span className="font-medium">{w.name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{w.role}</span></td>
                  <td className="font-medium">{fmt(w.salary)}<span className="text-stone-400 text-xs">/mo</span></td>
                  <td className="text-stone-400">{w.phone || '—'}</td>
                  <td className="text-stone-400">{w.employedDate}</td>
                  <td>{can.writeWorkers && <DeleteBtn onDelete={() => deleteWorker(w.id)} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  )
}
