'use client'
import { useState, useEffect, useCallback } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore, usePenTotals } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmtN, today } from '@/lib/utils'
import { farmService } from '@/services/farmService'
import { Plus, Bird, User, Loader2, PlusCircle } from 'lucide-react'
import type { BirdEntry } from '@/types'

const initForm = { name: '', totalBirds: '100', workerId: '' }
const initBirdForm = { date: today(), count: '', notes: '' }

function AddBirdsModal({ penId, penName, onClose, onDone }: { penId: string; penName: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState(initBirdForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.count || Number(form.count) < 1) return
    setSaving(true); setError('')
    try {
      await farmService.addBirds(penId, { date: form.date, count: Number(form.count), notes: form.notes || undefined })
      onDone(); onClose()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle size={18} className="text-brand-600" />
          <h2 className="font-medium">Add birds — {penName}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Number of birds added</label>
            <input type="number" className="input" placeholder="e.g. 200" value={form.count} onChange={e => set('count', e.target.value)} min={1} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input className="input" placeholder="e.g. New point-of-lay from ABC farm" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          {error && <div className="alert alert-danger py-2 text-xs">{error}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add birds
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PenCard({ penId, onAddBirds }: { penId: string; onAddBirds: (id: string, name: string) => void }) {
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
        <div className="flex items-center gap-1">
          {can.writeWorkers && (
            <button className="btn text-xs py-1 px-2 text-brand-600" onClick={() => onAddBirds(pen.id, pen.name)}>
              <PlusCircle size={11} /> Birds
            </button>
          )}
          {can.writeWorkers && <DeleteBtn onDelete={() => deletePen(pen.id)} />}
        </div>
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
  const { pens, workers, addPen, updatePen, loadAll } = useFarmStore() as any
  const { can } = useRole()
  const [form, setForm] = useState(initForm)
  const [assignPenId, setAssignPenId] = useState('')
  const [assignWorkerId, setAssignWorkerId] = useState('')
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [addBirdsModal, setAddBirdsModal] = useState<{ id: string; name: string } | null>(null)
  const [birdEntries, setBirdEntries] = useState<BirdEntry[]>([])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const loadBirdEntries = useCallback(async () => {
    try {
      const data = await farmService.getAllBirdEntries()
      setBirdEntries(data.map((r: any) => ({ ...r, date: r.date?.split('T')[0] ?? r.date })))
    } catch {}
  }, [])

  useEffect(() => { loadBirdEntries() }, [loadBirdEntries])

  async function handleAdd() {
    if (!form.name || !form.totalBirds) return
    setSaving(true)
    try {
      await addPen({ name: form.name, totalBirds: Number(form.totalBirds), workerId: form.workerId || undefined } as any)
      setForm(initForm)
    } finally { setSaving(false) }
  }

  async function handleAssign() {
    if (!assignPenId || !assignWorkerId) return
    setAssigning(true)
    try {
      await updatePen(assignPenId, { workerId: assignWorkerId })
      setAssignPenId(''); setAssignWorkerId('')
    } finally { setAssigning(false) }
  }

  const totalBirds = pens.reduce((s: number, p: any) => s + p.totalBirds, 0)
  const assigned = pens.filter((p: any) => p.workerId).length

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
                <label className="form-label">Initial bird count</label>
                <input type="number" className="input" value={form.totalBirds} onChange={e => set('totalBirds', e.target.value)} />
              </div>
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Assign staff (optional)</label>
              <select className="input" value={form.workerId} onChange={e => set('workerId', e.target.value)}>
                <option value="">— Select staff —</option>
                {workers.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add pen
            </button>
          </div>
        )}

        {can.writeWorkers && (
          <div className="card">
            <div className="section-title">Reassign pen to staff</div>
            <div className="form-group mb-3">
              <label className="form-label">Select pen</label>
              <select className="input" value={assignPenId} onChange={e => setAssignPenId(e.target.value)}>
                <option value="">— Select pen —</option>
                {pens.map((p: any) => <option key={p.id} value={p.id}>{p.name} {p.worker ? `(${p.worker.name})` : '(unassigned)'}</option>)}
              </select>
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Assign to staff</label>
              <select className="input" value={assignWorkerId} onChange={e => setAssignWorkerId(e.target.value)}>
                <option value="">— Select staff —</option>
                {workers.map((w: any) => <option key={w.id} value={w.id}>{w.name} — {w.role}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleAssign} disabled={!assignPenId || !assignWorkerId || assigning}>
              {assigning ? <Loader2 size={14} className="animate-spin" /> : <User size={14} />} Assign
            </button>
          </div>
        )}
      </div>

      <div className="section-title mb-3">All pens</div>
      {pens.length === 0 ? <EmptyState message="No pens created yet." /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {pens.map((pen: any) => <PenCard key={pen.id} penId={pen.id} onAddBirds={(id, name) => setAddBirdsModal({ id, name })} />)}
        </div>
      )}

      {/* Bird entry history */}
      <div className="card">
        <div className="section-title">Bird addition history</div>
        {birdEntries.length === 0 ? <EmptyState message="No bird additions recorded yet." /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Pen</th><th>Birds added</th><th>Notes</th></tr></thead>
              <tbody>
                {birdEntries.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td><span className="badge badge-blue">{r.pen?.name ?? '—'}</span></td>
                    <td><span className="text-brand-600 font-medium">+{fmtN(r.count)}</span></td>
                    <td className="text-stone-400">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addBirdsModal && (
        <AddBirdsModal
          penId={addBirdsModal.id}
          penName={addBirdsModal.name}
          onClose={() => setAddBirdsModal(null)}
          onDone={() => {
            loadBirdEntries()
            loadAll()  // refreshes pen totalBirds
          }}
        />
      )}
    </Shell>
  )
}
