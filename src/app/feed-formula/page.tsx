'use client'
import { useState, useEffect, useCallback } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { farmService } from '@/services/farmService'
import { fmtN, today } from '@/lib/utils'
import { Plus, FlaskConical, Package, ClipboardList } from 'lucide-react'
import type { FeedFormula, FeedBatch, FeedUsageRecord, StockItem } from '@/types'

const UNITS = ['bags', 'kg', 'litres', 'pcs']

export default function FeedFormulaPage() {
  const { pens } = useFarmStore()
  const { can } = useRole()
  const [tab, setTab] = useState<'formulas' | 'batches' | 'usage'>('formulas')
  const [formulas, setFormulas] = useState<FeedFormula[]>([])
  const [batches, setBatches] = useState<FeedBatch[]>([])
  const [usages, setUsages] = useState<FeedUsageRecord[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Formula builder state
  const [showFormulaForm, setShowFormulaForm] = useState(false)
  const [formulaName, setFormulaName] = useState('')
  const [formulaDesc, setFormulaDesc] = useState('')
  const [formulaUnit, setFormulaUnit] = useState('bags')
  const [ingredients, setIngredients] = useState<{ stockId: string; qtyPerUnit: string }[]>([
    { stockId: '', qtyPerUnit: '' }
  ])

  // Batch production state
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [batchForm, setBatchForm] = useState({ formulaId: '', date: today(), batchNo: '', qtyProduced: '', notes: '' })

  // Usage state
  const [showUsageForm, setShowUsageForm] = useState(false)
  const [usageForm, setUsageForm] = useState({ batchId: '', date: today(), qty: '', penId: '', notes: '' })

  const load = useCallback(async () => {
    try {
      const [f, b, u, s] = await Promise.all([
        farmService.getFormulas(),
        farmService.getBatches(),
        farmService.getUsages(),
        farmService.getStock(),
      ])
      setFormulas(f as any)
      setBatches(b as any)
      setUsages(u as any)
      setStockItems(s.map((r: any) => ({ ...r, category: r.category })))
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-generate batch number
  useEffect(() => {
    if (showBatchForm) {
      const next = `BATCH-${String(batches.length + 1).padStart(3, '0')}`
      setBatchForm(f => ({ ...f, batchNo: next }))
    }
  }, [showBatchForm, batches.length])

  async function handleCreateFormula(e: React.FormEvent) {
    e.preventDefault()
    const validIngredients = ingredients.filter(i => i.stockId && i.qtyPerUnit)
    if (!formulaName || validIngredients.length === 0) return
    setLoading(true); setError('')
    try {
      await farmService.createFormula({
        name: formulaName, description: formulaDesc, unit: formulaUnit,
        ingredients: validIngredients.map(i => ({ stockId: i.stockId, qtyPerUnit: Number(i.qtyPerUnit) })),
      })
      setFormulaName(''); setFormulaDesc(''); setFormulaUnit('bags')
      setIngredients([{ stockId: '', qtyPerUnit: '' }])
      setShowFormulaForm(false); load()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setLoading(false) }
  }

  async function handleProduceBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!batchForm.formulaId || !batchForm.qtyProduced) return
    setLoading(true); setError('')
    try {
      await farmService.produceBatch({
        formulaId: batchForm.formulaId, date: batchForm.date,
        batchNo: batchForm.batchNo, qtyProduced: Number(batchForm.qtyProduced),
        notes: batchForm.notes || undefined,
      })
      setBatchForm({ formulaId: '', date: today(), batchNo: '', qtyProduced: '', notes: '' })
      setShowBatchForm(false); load()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setLoading(false) }
  }

  async function handleRecordUsage(e: React.FormEvent) {
    e.preventDefault()
    if (!usageForm.batchId || !usageForm.qty) return
    setLoading(true); setError('')
    try {
      await farmService.recordUsage({
        batchId: usageForm.batchId, date: usageForm.date,
        qty: Number(usageForm.qty), penId: usageForm.penId || undefined,
        notes: usageForm.notes || undefined,
      })
      setUsageForm({ batchId: '', date: today(), qty: '', penId: '', notes: '' })
      setShowUsageForm(false); load()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setLoading(false) }
  }

  const totalProduced = batches.reduce((s, b) => s + b.qtyProduced, 0)
  const totalRemaining = batches.reduce((s, b) => s + b.qtyRemaining, 0)
  const totalUsed = usages.reduce((s, u) => s + u.qty, 0)

  return (
    <Shell>
      <PageHeader title="Feed Formulation" subtitle="In-house feed production, batches and usage tracking" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Formulas</div><div className="kpi-value">{formulas.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Batches produced</div><div className="kpi-value">{batches.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total remaining</div><div className="kpi-value text-brand-600">{fmtN(totalRemaining)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total used</div><div className="kpi-value text-red-500">{fmtN(totalUsed)}</div></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={`btn ${tab === 'formulas' ? 'btn-primary' : ''}`} onClick={() => setTab('formulas')}><FlaskConical size={14} /> Formulas</button>
        <button className={`btn ${tab === 'batches' ? 'btn-primary' : ''}`} onClick={() => setTab('batches')}><Package size={14} /> Batches</button>
        <button className={`btn ${tab === 'usage' ? 'btn-primary' : ''}`} onClick={() => setTab('usage')}><ClipboardList size={14} /> Usage log</button>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* ── FORMULAS TAB ─────────────────────────────────── */}
      {tab === 'formulas' && (
        <>
          {can.writeInventory && (
            <button className="btn btn-primary mb-4" onClick={() => setShowFormulaForm(!showFormulaForm)}>
              <Plus size={14} /> {showFormulaForm ? 'Cancel' : 'Create formula'}
            </button>
          )}

          {showFormulaForm && (
            <div className="card mb-4">
              <div className="section-title">New feed formula</div>
              <form onSubmit={handleCreateFormula} className="space-y-4">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Formula name</label><input className="input" placeholder="e.g. Layers Mash Formula A" value={formulaName} onChange={e => setFormulaName(e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Unit of measurement</label>
                    <select className="input" value={formulaUnit} onChange={e => setFormulaUnit(e.target.value)}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Description (optional)</label><input className="input" placeholder="e.g. Standard laying hen formula" value={formulaDesc} onChange={e => setFormulaDesc(e.target.value)} /></div>

                <div>
                  <div className="section-title">Ingredients (qty per {formulaUnit})</div>
                  <div className="space-y-2">
                    {ingredients.map((ing, i) => (
                      <div key={i} className="flex gap-2 items-end">
                        <div className="form-group flex-1">
                          {i === 0 && <label className="form-label">Stock item</label>}
                          <select className="input" value={ing.stockId} onChange={e => { const n = [...ingredients]; n[i].stockId = e.target.value; setIngredients(n) }}>
                            <option value="">— Select item —</option>
                            {stockItems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                          </select>
                        </div>
                        <div className="form-group w-36">
                          {i === 0 && <label className="form-label">Qty per {formulaUnit}</label>}
                          <div className="flex items-center gap-1">
                            <input type="number" className="input" placeholder="e.g. 3" value={ing.qtyPerUnit} onChange={e => { const n = [...ingredients]; n[i].qtyPerUnit = e.target.value; setIngredients(n) }} min={0.001} step={0.001} />
                            <span className="text-xs text-stone-400 whitespace-nowrap">
                              {stockItems.find(s => s.id === ing.stockId)?.unit ?? ''}
                            </span>
                          </div>
                        </div>
                        <button type="button" className="btn btn-danger mb-0.5" onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="btn text-xs" onClick={() => setIngredients([...ingredients, { stockId: '', qtyPerUnit: '' }])}>
                      <Plus size={12} /> Add ingredient
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save formula'}</button>
              </form>
            </div>
          )}

          <div className="card">
            <div className="section-title">All formulas</div>
            {formulas.length === 0 ? <EmptyState message="No formulas yet. Create your first formula above." /> : (
              <div className="space-y-3">
                {formulas.map(f => (
                  <div key={f.id} className="border border-stone-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-stone-900">{f.name}</div>
                        {f.description && <div className="text-xs text-stone-400 mt-0.5">{f.description}</div>}
                        <div className="text-xs text-stone-400 mt-1">Unit: <strong>{f.unit}</strong> · Batches: <strong>{f._count?.batches ?? 0}</strong> · Created: {f.createdAt?.split('T')[0]}</div>
                      </div>
                      {can.writeInventory && <DeleteBtn onDelete={async () => { await farmService.deleteFormula(f.id); load() }} />}
                    </div>
                    <div className="section-title mb-2">Ingredients per {f.unit}</div>
                    <div className="flex flex-wrap gap-2">
                      {f.ingredients.map(ing => (
                        <div key={ing.id} className="bg-stone-50 rounded-lg px-3 py-1.5 text-xs">
                          <span className="font-medium">{ing.stock.name}</span>
                          <span className="text-stone-400"> — {fmtN(ing.qtyPerUnit)} {ing.stock.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── BATCHES TAB ──────────────────────────────────── */}
      {tab === 'batches' && (
        <>
          {can.writeInventory && (
            <button className="btn btn-primary mb-4" onClick={() => setShowBatchForm(!showBatchForm)}>
              <Plus size={14} /> {showBatchForm ? 'Cancel' : 'Record production'}
            </button>
          )}

          {showBatchForm && (
            <div className="card mb-4">
              <div className="section-title">Record feed production batch</div>
              <form onSubmit={handleProduceBatch} className="space-y-3">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Formula</label>
                    <select className="input" value={batchForm.formulaId} onChange={e => setBatchForm(f => ({ ...f, formulaId: e.target.value }))} required>
                      <option value="">— Select formula —</option>
                      {formulas.map(f => <option key={f.id} value={f.id}>{f.name} ({f.unit})</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Date produced</label><input type="date" className="input" value={batchForm.date} onChange={e => setBatchForm(f => ({ ...f, date: e.target.value }))} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Batch number</label><input className="input" value={batchForm.batchNo} onChange={e => setBatchForm(f => ({ ...f, batchNo: e.target.value }))} required /></div>
                  <div className="form-group">
                    <label className="form-label">Qty produced ({formulas.find(f => f.id === batchForm.formulaId)?.unit ?? 'units'})</label>
                    <input type="number" className="input" placeholder="e.g. 50" value={batchForm.qtyProduced} onChange={e => setBatchForm(f => ({ ...f, qtyProduced: e.target.value }))} min={0.01} step={0.01} required />
                  </div>
                </div>
                {batchForm.formulaId && batchForm.qtyProduced && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>Ingredients that will be deducted from stock:</strong>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {formulas.find(f => f.id === batchForm.formulaId)?.ingredients.map(ing => (
                        <span key={ing.id} className="bg-amber-100 rounded px-2 py-0.5">
                          {ing.stock.name}: {fmtN(ing.qtyPerUnit * Number(batchForm.qtyProduced))} {ing.stock.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="form-group"><label className="form-label">Notes (optional)</label><input className="input" placeholder="e.g. June production run" value={batchForm.notes} onChange={e => setBatchForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Produce batch'}</button>
              </form>
            </div>
          )}

          <div className="card">
            <div className="section-title">Production batches</div>
            {batches.length === 0 ? <EmptyState message="No batches produced yet." /> : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Batch no.</th><th>Formula</th><th>Date</th><th>Produced</th><th>Remaining</th><th>Used</th><th>Notes</th><th>Recorded at</th></tr></thead>
                  <tbody>
                    {batches.map(b => {
                      const unit = b.formula?.unit ?? ''
                      const used = b.qtyProduced - b.qtyRemaining
                      const low = b.qtyRemaining === 0
                      return (
                        <tr key={b.id} className={low ? 'opacity-50' : ''}>
                          <td className="font-medium">{b.batchNo}</td>
                          <td><span className="badge badge-green">{b.formula?.name ?? '—'}</span></td>
                          <td>{b.date?.split('T')[0]}</td>
                          <td>{fmtN(b.qtyProduced)} <span className="text-stone-400 text-xs">{unit}</span></td>
                          <td className={b.qtyRemaining === 0 ? 'text-stone-400' : 'text-brand-600 font-medium'}>{fmtN(b.qtyRemaining)} {unit}</td>
                          <td className="text-red-400">{fmtN(used)} {unit}</td>
                          <td className="text-stone-400">{b.notes || '—'}</td>
                          <td className="text-stone-400 text-xs">{b.createdAt ? new Date(b.createdAt).toLocaleString('en-NG') : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── USAGE TAB ────────────────────────────────────── */}
      {tab === 'usage' && (
        <>
          {(can.writeInventory || can.writeProduction) && (
            <button className="btn btn-primary mb-4" onClick={() => setShowUsageForm(!showUsageForm)}>
              <Plus size={14} /> {showUsageForm ? 'Cancel' : 'Record usage'}
            </button>
          )}

          {showUsageForm && (
            <div className="card mb-4">
              <div className="section-title">Record feed usage</div>
              <form onSubmit={handleRecordUsage} className="space-y-3">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Batch</label>
                    <select className="input" value={usageForm.batchId} onChange={e => setUsageForm(f => ({ ...f, batchId: e.target.value }))} required>
                      <option value="">— Select batch —</option>
                      {batches.filter(b => b.qtyRemaining > 0).map(b => (
                        <option key={b.id} value={b.id}>{b.batchNo} — {b.formula?.name} ({fmtN(b.qtyRemaining)} {b.formula?.unit} left)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Date used</label><input type="date" className="input" value={usageForm.date} onChange={e => setUsageForm(f => ({ ...f, date: e.target.value }))} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Qty used ({batches.find(b => b.id === usageForm.batchId)?.formula?.unit ?? 'units'})
                    </label>
                    <input type="number" className="input" placeholder="e.g. 5" value={usageForm.qty} onChange={e => setUsageForm(f => ({ ...f, qty: e.target.value }))} min={0.01} step={0.01} required />
                  </div>
                  <div className="form-group"><label className="form-label">Pen (optional)</label>
                    <select className="input" value={usageForm.penId} onChange={e => setUsageForm(f => ({ ...f, penId: e.target.value }))}>
                      <option value="">— Farm-wide —</option>
                      {pens.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Notes (optional)</label><input className="input" placeholder="e.g. Morning feeding" value={usageForm.notes} onChange={e => setUsageForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Record usage'}</button>
              </form>
            </div>
          )}

          <div className="card">
            <div className="section-title">Usage log</div>
            {usages.length === 0 ? <EmptyState message="No usage recorded yet." /> : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Date</th><th>Batch</th><th>Formula</th><th>Qty used</th><th>Pen</th><th>Notes</th><th>Recorded at</th></tr></thead>
                  <tbody>
                    {usages.map(u => (
                      <tr key={u.id}>
                        <td>{u.date?.split('T')[0]}</td>
                        <td className="font-medium text-stone-600">{(u as any).batch?.batchNo ?? '—'}</td>
                        <td><span className="badge badge-green">{u.batch?.formula?.name ?? '—'}</span></td>
                        <td className="text-red-500 font-medium">{fmtN(u.qty)} <span className="text-stone-400 text-xs">{u.batch?.formula?.unit}</span></td>
                        <td className="text-stone-400">{u.pen?.name ?? 'Farm-wide'}</td>
                        <td className="text-stone-400">{u.notes || '—'}</td>
                        <td className="text-stone-400 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleString('en-NG') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Shell>
  )
}
