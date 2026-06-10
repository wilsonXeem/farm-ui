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

const initForm = {
  date: today(), penId: '',
  totalCrates: '', totalLoose: '',
  crackedCrates: '0', crackedLoose: '0',
  spoiltEggs: '0', notes: '',
}

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

  // Combine crates + loose into total pieces
  const totalEggsPieces = (Number(form.totalCrates) * 30) + Number(form.totalLoose)
  const crackedPieces = (Number(form.crackedCrates) * 30) + Number(form.crackedLoose)
  const preview = Math.max(0, totalEggsPieces - crackedPieces - Number(form.spoiltEggs))
  const previewCrates = Math.floor(preview / 30)
  const previewLoose = preview % 30

  const hasInput = form.totalCrates || form.totalLoose

  async function handleAdd() {
    if (!form.date || !totalEggsPieces || !form.penId) return
    setSaving(true)
    try {
      await addProduction({
        date: form.date,
        totalEggs: totalEggsPieces,
        crackedEggs: crackedPieces,
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

          {/* Total eggs — crates + loose */}
          <div className="mb-3">
            <label className="form-label">Total eggs produced</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <input type="number" className="input" placeholder="Crates" min={0} value={form.totalCrates} onChange={e => set('totalCrates', e.target.value)} />
                <span className="text-xs text-stone-400 mt-0.5 block text-center">crates</span>
              </div>
              <span className="text-stone-400 font-medium pb-4">+</span>
              <div className="flex-1">
                <input type="number" className="input" placeholder="Loose pieces" min={0} max={29} value={form.totalLoose} onChange={e => set('totalLoose', e.target.value)} />
                <span className="text-xs text-stone-400 mt-0.5 block text-center">loose pieces</span>
              </div>
              {totalEggsPieces > 0 && (
                <div className="pb-4 text-sm text-stone-500 whitespace-nowrap">= <strong className="text-brand-600">{fmtN(totalEggsPieces)}</strong> eggs</div>
              )}
            </div>
          </div>

          {/* Cracked eggs — crates + loose */}
          <div className="mb-3">
            <label className="form-label">Cracked eggs</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <input type="number" className="input" placeholder="Crates" min={0} value={form.crackedCrates} onChange={e => set('crackedCrates', e.target.value)} />
                <span className="text-xs text-stone-400 mt-0.5 block text-center">crates</span>
              </div>
              <span className="text-stone-400 font-medium pb-4">+</span>
              <div className="flex-1">
                <input type="number" className="input" placeholder="Loose pieces" min={0} value={form.crackedLoose} onChange={e => set('crackedLoose', e.target.value)} />
                <span className="text-xs text-stone-400 mt-0.5 block text-center">loose pieces</span>
              </div>
              {crackedPieces > 0 && (
                <div className="pb-4 text-sm text-stone-500 whitespace-nowrap">= <strong className="text-red-500">{fmtN(crackedPieces)}</strong> eggs</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Spoilt eggs (pieces)</label>
              <input type="number" className="input" value={form.spoiltEggs} min={0} onChange={e => set('spoiltEggs', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input type="text" className="input" placeholder="e.g. birds laying well" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !totalEggsPieces || !form.penId}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add record
            </button>
            {hasInput && totalEggsPieces > 0 && (
              <span className="text-sm text-stone-500">
                Good eggs: <strong className="text-brand-600">{fmtN(preview)}</strong>
                {' · '}
                Crates: <strong className="text-brand-600">{fmtN(previewCrates)}</strong>
                {previewLoose > 0 && <span className="text-stone-400"> + {previewLoose} loose</span>}
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
                      {r.goodEggs % 30 > 0 && <span className="text-stone-400 text-xs"> + {r.goodEggs % 30}</span>}
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
