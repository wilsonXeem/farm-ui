'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmt, today, getInitials } from '@/lib/utils'
import { Plus, Loader2, Pencil, TrendingUp } from 'lucide-react'
import type { Worker } from '@/types'

const initForm = { name: '', role: '', type: 'Permanent' as 'Permanent' | 'Auxiliary', salary: '', phone: '' }

function EditWorkerModal({ worker, onClose, onDone }: { worker: Worker; onClose: () => void; onDone: () => void }) {
  const { updateWorker } = useFarmStore() as any
  const [form, setForm] = useState({
    name: worker.name,
    role: worker.role,
    type: worker.type,
    salary: String(worker.salary),
    phone: worker.phone ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const salaryChanged = Number(form.salary) !== worker.salary
  const roleChanged = form.role !== worker.role

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await updateWorker(worker.id, {
        name: form.name,
        role: form.role,
        type: form.type,
        salary: Number(form.salary),
        phone: form.phone || undefined,
      })
      onDone(); onClose()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <Pencil size={16} className="text-brand-600" />
          <h2 className="font-medium">Edit — {worker.name}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role / Position</label>
              <input className="input" placeholder="e.g. Senior Feed Attendant" value={form.role} onChange={e => set('role', e.target.value)} />
              {roleChanged && <span className="text-xs text-blue-500 mt-0.5 block">Promotion: {worker.role} → {form.role}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Staff type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="Permanent">Permanent</option>
                <option value="Auxiliary">Auxiliary</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Monthly salary (₦)</label>
              <input type="number" className="input" value={form.salary} onChange={e => set('salary', e.target.value)} min={0} required />
              {salaryChanged && (
                <span className={`text-xs mt-0.5 block ${Number(form.salary) > worker.salary ? 'text-brand-600' : 'text-red-500'}`}>
                  {Number(form.salary) > worker.salary ? '↑' : '↓'} {fmt(worker.salary)} → {fmt(Number(form.salary))}
                </span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          {error && <div className="alert alert-danger py-2 text-xs">{error}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />} Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WorkersPage() {
  const { workers, addWorker, deleteWorker } = useFarmStore() as any
  const { can } = useRole()
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const [editWorker, setEditWorker] = useState<Worker | null>(null)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const permanent = workers.filter((w: Worker) => w.type !== 'Auxiliary')
  const auxiliary = workers.filter((w: Worker) => w.type === 'Auxiliary')
  const totalSalary = workers.reduce((s: number, w: Worker) => s + w.salary, 0)
  const permanentSalary = permanent.reduce((s: number, w: Worker) => s + w.salary, 0)
  const auxiliarySalary = auxiliary.reduce((s: number, w: Worker) => s + w.salary, 0)

  async function handleAdd() {
    if (!form.name || !form.salary) return
    setSaving(true)
    try {
      await addWorker({ name: form.name, role: form.role, type: form.type, salary: Number(form.salary), phone: form.phone, employedDate: today() })
      setForm(initForm)
    } finally { setSaving(false) }
  }

  function WorkerTable({ list }: { list: Worker[] }) {
    return list.length === 0 ? <EmptyState message="No staff in this category." /> : (
      <table className="tbl">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Type</th><th>Salary</th><th>Phone</th><th>Employed</th><th></th><th></th></tr>
        </thead>
        <tbody>
          {list.map((w: Worker) => (
            <tr key={w.id}>
              <td>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {getInitials(w.name)}
                  </div>
                  <span className="font-medium">{w.name}</span>
                </div>
              </td>
              <td><span className="badge badge-blue">{w.role || '—'}</span></td>
              <td><span className={`badge ${w.type === 'Auxiliary' ? 'badge-amber' : 'badge-green'}`}>{w.type}</span></td>
              <td className="font-medium">{fmt(w.salary)}<span className="text-stone-400 text-xs">/mo</span></td>
              <td className="text-stone-400">{w.phone || '—'}</td>
              <td className="text-stone-400">{w.employedDate}</td>
              <td>
                {can.writeWorkers && (
                  <button className="btn text-xs py-1 px-2 text-brand-600" onClick={() => setEditWorker(w)}>
                    <Pencil size={11} /> Edit
                  </button>
                )}
              </td>
              <td>{can.writeWorkers && <DeleteBtn onDelete={() => deleteWorker(w.id)} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <Shell>
      <PageHeader title="Workers" subtitle="Staff management, promotions and salary information" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total staff</div><div className="kpi-value">{workers.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Monthly salary bill</div><div className="kpi-value text-red-500">{fmt(totalSalary)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Permanent ({permanent.length})</div><div className="kpi-value">{fmt(permanentSalary)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Auxiliary ({auxiliary.length})</div><div className="kpi-value">{fmt(auxiliarySalary)}</div></div>
      </div>

      {can.writeWorkers && (
        <div className="card mb-4">
          <div className="section-title">Add worker</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Role / Position</label><input className="input" placeholder="e.g. Feed attendant" value={form.role} onChange={e => set('role', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Staff type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="Permanent">Permanent</option>
                <option value="Auxiliary">Auxiliary</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Monthly salary (₦)</label><input type="number" className="input" value={form.salary} onChange={e => set('salary', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add worker
          </button>
        </div>
      )}

      <div className="card mb-4">
        <div className="section-title">Permanent staff</div>
        <WorkerTable list={permanent} />
      </div>

      <div className="card">
        <div className="section-title">Auxiliary staff</div>
        <WorkerTable list={auxiliary} />
      </div>

      {editWorker && (
        <EditWorkerModal
          worker={editWorker}
          onClose={() => setEditWorker(null)}
          onDone={() => setEditWorker(null)}
        />
      )}
    </Shell>
  )
}
