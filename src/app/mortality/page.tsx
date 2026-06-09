'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import KpiCard from '@/components/ui/KpiCard'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore, useTotals } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmtN, today } from '@/lib/utils'
import { Plus, Loader2 } from 'lucide-react'

import { useStaffPens } from '@/hooks/useStaffPens'

const CAUSES = ['Disease', 'Heat stress', 'Predator', 'Hanging', 'Unknown', 'Other']
const initForm = { date: today(), count: '', cause: 'Disease', notes: '', penId: '' }

export default function MortalityPage() {
  const { mortality, pens, addMortality, deleteMortality } = useFarmStore()
  const { availableBirds, totalMortality, totalBirds } = useTotals()
  const { can } = useRole()
  const { myPens } = useStaffPens()
  const availablePens = can.deleteMortality ? pens : myPens
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleAdd() {
    if (!form.date || !form.count || !form.penId) return
    setSaving(true)
    Promise.resolve(
      addMortality({ date: form.date, count: Number(form.count), cause: form.cause, notes: form.notes, penId: form.penId })
    ).then(() => setForm(initForm)).finally(() => setSaving(false))
  }

  const sorted = [...mortality].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Shell>
      <PageHeader title="Mortality" subtitle="Track bird deaths per pen" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <KpiCard label="Birds available" value={fmtN(availableBirds)} color="green" />
        <KpiCard label="Total deaths" value={fmtN(totalMortality)} color="red" />
        <KpiCard label="Mortality rate" value={totalBirds > 0 ? ((totalMortality / totalBirds) * 100).toFixed(1) + '%' : '0%'} />
      </div>

      {pens.length > 0 && (
        <div className="card mb-4">
          <div className="section-title">Birds per pen</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pens.map(pen => {
              const deaths = mortality.filter(r => r.penId === pen.id).reduce((s, r) => s + r.count, 0)
              const available = pen.totalBirds - deaths
              return (
                <div key={pen.id} className="bg-stone-50 rounded-lg p-3 text-center">
                  <div className="text-xs font-medium text-stone-600 mb-1">{pen.name}</div>
                  <div className="text-lg font-medium text-brand-600">{fmtN(available)}</div>
                  <div className="text-[10px] text-stone-400">of {pen.totalBirds}</div>
                  {deaths > 0 && <div className="text-[10px] text-red-400 mt-0.5">{deaths} dead</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {can.writeMortality && (
        <div className="card mb-4">
          <div className="section-title">Record mortality</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Pen</label>
              <select className="input" value={form.penId} onChange={e => set('penId', e.target.value)}>
                <option value="">— Select pen —</option>
                {availablePens.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Number of deaths</label>
              <input type="number" className="input" placeholder="e.g. 2" value={form.count} onChange={e => set('count', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cause of death</label>
              <select className="input" value={form.cause} onChange={e => set('cause', e.target.value)}>
                {CAUSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label">Notes</label>
            <input type="text" className="input" placeholder="Details..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Record
          </button>
        </div>
      )}

      <div className="card">
        <div className="section-title">Mortality log</div>
        {sorted.length === 0 ? <EmptyState message="No mortality recorded." /> : (
          <table className="tbl">
            <thead><tr><th>Date</th><th>Pen</th><th>Deaths</th><th>Cause</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td><span className="badge badge-blue">{r.pen?.name ?? '—'}</span></td>
                  <td><span className="badge badge-red">{fmtN(r.count)}</span></td>
                  <td>{r.cause}</td>
                  <td className="text-stone-400">{r.notes || '—'}</td>
                  <td>{can.deleteMortality && <DeleteBtn onDelete={() => deleteMortality(r.id)} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  )
}
