'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import KpiCard from '@/components/ui/KpiCard'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmt, fmtN, today } from '@/lib/utils'
import { Plus, Loader2 } from 'lucide-react'

import { useStaffPens } from '@/hooks/useStaffPens'

const initForm = { date: today(), totalEggs: '', crackedEggs: '0', spoiltEggs: '0', notes: '', penId: '' }

export default function ProductionPage() {
  const { production, pens, addProduction, deleteProduction } = useFarmStore()
  const { can } = useRole()
  const { myPens } = useStaffPens()
  const availablePens = can.deleteProduction ? pens : myPens
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const total = production.reduce((s, r) => s + r.totalEggs, 0)
  const good = production.reduce((s, r) => s + r.goodEggs, 0)
  const cracked = production.reduce((s, r) => s + r.crackedEggs, 0)
  const goodCrates = Math.floor(good / 30)
  const preview = Math.max(0, Number(form.totalEggs) - Number(form.crackedEggs) - Number(form.spoiltEggs))
  const previewCrates = Math.floor(preview / 30)

  async function handleAdd() {
    if (!form.date || !form.totalEggs || !form.penId) return
    setSaving(true)
    try {
      await addProduction({
        date: form.date,
        totalEggs: Number(form.totalEggs),
        crackedEggs: Number(form.crackedEggs),
        spoiltEggs: Number(form.spoiltEggs),
        notes: form.notes,
        penId: form.penId,
      })
      setForm(initForm)
    } finally { setSaving(false) }
  }

  const sorted = [...production].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Shell>
      <PageHeader title="Production" subtitle="Daily egg production tracking per pen" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total eggs produced" value={fmtN(total)} />
        <KpiCard label="Good eggs" value={fmtN(good)} color="green" />
        <KpiCard label="Good crates" value={fmtN(goodCrates)} sub={`${fmtN(good % 30)} loose`} color="green" />
        <KpiCard label="Cracked eggs" value={fmtN(cracked)} color="red" />
      </div>

      {can.writeProduction && (
        <div className="card mb-4">
          <div className="section-title">Record daily production</div>
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
              <label className="form-label">Total eggs produced</label>
              <input type="number" className="input" placeholder="e.g. 90" value={form.totalEggs} onChange={e => set('totalEggs', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cracked eggs</label>
              <input type="number" className="input" value={form.crackedEggs} onChange={e => set('crackedEggs', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Spoilt eggs</label>
              <input type="number" className="input" value={form.spoiltEggs} onChange={e => set('spoiltEggs', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input type="text" className="input" placeholder="e.g. birds laying well" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add record
            </button>
            {form.totalEggs && (
              <span className="text-sm text-stone-500">
                Good eggs: <strong className="text-brand-600">{fmtN(preview)}</strong>
                {preview >= 30 && <> · Crates: <strong className="text-brand-600">{fmtN(previewCrates)}</strong> <span className="text-stone-400">+ {preview % 30} loose</span></>}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-title">Production log</div>
        {sorted.length === 0 ? <EmptyState /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Date</th><th>Pen</th><th>Total</th><th>Cracked</th><th>Spoilt</th><th>Good eggs</th><th>Crates</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td><span className="badge badge-blue">{r.pen?.name ?? '—'}</span></td>
                    <td>{fmtN(r.totalEggs)}</td>
                    <td className="text-red-500">{fmtN(r.crackedEggs)}</td>
                    <td className="text-amber-600">{fmtN(r.spoiltEggs)}</td>
                    <td><strong className="text-brand-600">{fmtN(r.goodEggs)}</strong></td>
                    <td className="text-stone-500">
                      <strong>{Math.floor(r.goodEggs / 30)}</strong>
                      <span className="text-stone-400 text-xs"> + {r.goodEggs % 30}</span>
                    </td>
                    <td className="text-stone-400">{r.notes || '—'}</td>
                    <td>{can.deleteProduction && <DeleteBtn onDelete={() => deleteProduction(r.id)} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  )
}
