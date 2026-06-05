'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore, usePenTotals } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmtN } from '@/lib/utils'
import { Plus, Bird, User } from 'lucide-react'

const initForm = { name: '', totalBirds: '100', workerId: '' }

function PenCard({ penId }: { penId: string }) {
  const { pens, workers, deletePen } = useFarmStore()
  const { can } = useRole()
  const pen = pens.find(p => p.id === penId)!
  const { goodEggs, deaths, availableBirds } = usePenTotals(penId)
  const worker = workers.find(w => w.id === pen.workerId)

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-medium text-stone-900">{pen.name}</div>
          <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
            <User size={11} />
            {worker ? worker.name : <span className="text-amber-500">Unassigned</span>}
          </div>
        </div>
        {can.writeWorkers && <DeleteBtn onDelete={() => deletePen(pen.id)} />}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="bg-stone-50 rounded-lg p-2 text-center">
          <div className="text-xs text-stone-400 mb-0.5">Total birds</div>
          <div className="font-medium text-sm">{fmtN(pen.totalBirds)}</div>
        </div>
        <div className="bg-brand-50 rounded-lg p-2 text-center">
          <div className="text-xs text-stone-400 mb-0.5">Available</div>
          <div className="font-medium text-sm text-brand-600">{fmtN(availableBirds)}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <div className="text-xs text-stone-400 mb-0.5">Deaths</div>
          <div className="font-medium text-sm text-red-500">{fmtN(deaths)}</div>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-stone-100 flex justify-between text-xs text-stone-400">
        <span>Good eggs (total)</span>
        <span className="font-medium text-brand-600">{fmtN(goodEggs)}</span>
      </div>
    </div>
  )
}

export default function PensPage() {
  const { pens, workers, addPen, updatePen } = useFarmStore()
  const { can } = useRole()
  const [form, setForm] = useState(initForm)
  const [assignPenId, setAssignPenId] = useState('')
  const [assignWorkerId, setAssignWorkerId] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleAdd() {
    if (!form.name || !form.totalBirds) return
    await addPen({ name: form.name, totalBirds: Number(form.totalBirds), workerId: form.workerId || undefined } as any)
    setForm(initForm)
  }

  async function handleAssign() {
    if (!assignPenId || !assignWorkerId) return
    await updatePen(assignPenId, { workerId: assignWorkerId })
    setAssignPenId('')
    setAssignWorkerId('')
  }

  const totalBirds = pens.reduce((s, p) => s + p.totalBirds, 0)
  const assigned = pens.filter(p => p.workerId).length

  return (
    <Shell>
      <PageHeader title="Pens" subtitle="Manage pens, bird counts and staff assignments" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total pens</div><div className="kpi-value">{pens.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total birds</div><div className="kpi-value">{fmtN(totalBirds)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Assigned pens</div><div className="kpi-value text-brand-600">{assigned} / {pens.length}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {can.writeWorkers && (
          <div className="card">
            <div className="section-title">Add new pen</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Pen name</label>
                <input className="input" placeholder="e.g. Pen 6" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Bird count</label>
                <input type="number" className="input" value={form.totalBirds} onChange={e => set('totalBirds', e.target.value)} />
              </div>
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Assign staff (optional)</label>
              <select className="input" value={form.workerId} onChange={e => set('workerId', e.target.value)}>
                <option value="">— Select staff —</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}><Plus size={14} /> Add pen</button>
          </div>
        )}

        {can.writeWorkers && (
          <div className="card">
            <div className="section-title">Reassign pen to staff</div>
            <div className="form-group mb-3">
              <label className="form-label">Select pen</label>
              <select className="input" value={assignPenId} onChange={e => setAssignPenId(e.target.value)}>
                <option value="">— Select pen —</option>
                {pens.map(p => <option key={p.id} value={p.id}>{p.name} {p.worker ? `(${p.worker.name})` : '(unassigned)'}</option>)}
              </select>
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Assign to staff</label>
              <select className="input" value={assignWorkerId} onChange={e => setAssignWorkerId(e.target.value)}>
                <option value="">— Select staff —</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name} — {w.role}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleAssign} disabled={!assignPenId || !assignWorkerId}>
              <User size={14} /> Assign
            </button>
          </div>
        )}
      </div>

      <div className="section-title">All pens</div>
      {pens.length === 0 ? <EmptyState message="No pens created yet." /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {pens.map(pen => <PenCard key={pen.id} penId={pen.id} />)}
        </div>
      )}
    </Shell>
  )
}
