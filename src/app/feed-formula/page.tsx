'use client'
import { useState, useEffect, useCallback } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { farmService } from '@/services/farmService'
import { fmtN, fmt, today } from '@/lib/utils'
import { Plus, FlaskConical, Package, ClipboardList } from 'lucide-react'
import type { FeedFormula, FeedBatch, FeedUsageRecord, StockItem } from '@/types'

export default function FeedFormulaPage() {
  const { pens } = useFarmStore()
  const { refresh } = useFarmStore() as any
  const { can } = useRole()
  const [tab, setTab] = useState<'formulas' | 'batches' | 'usage'>('formulas')
  const [formulas, setFormulas] = useState<FeedFormula[]>([])
  const [batches, setBatches] = useState<FeedBatch[]>([])
  const [usages, setUsages] = useState<FeedUsageRecord[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Formula form
  const [showFormulaForm, setShowFormulaForm] = useState(false)
  const [formulaName, setFormulaName] = useState('')
  const [formulaDesc, setFormulaDesc] = useState('')
  const [formulaUnit, setFormulaUnit] = useState('bags')
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([''])

  // Batch form
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [batchForm, setBatchForm] = useState({ formulaId: '', date: today(), batchNo: '', qtyProduced: '', notes: '' })
  // Actual quantities per ingredient for the batch
  const [batchIngredientQtys, setBatchIngredientQtys] = useState<Record<string, string>>({})

  // Usage form
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

  useEffect(() => {
    if (showBatchForm) {
      const next = `BATCH-${String(batches.length + 1).padStart(3, '0')}`
      setBatchForm(f => ({ ...f, batchNo: next }))
      setBatchIngredientQtys({})
    }
  }, [showBatchForm, batches.length])

  // When formula selection changes, reset ingredient qty inputs
  useEffect(() => {
    setBatchIngredientQtys({})
  }, [batchForm.formulaId])

  async function handleCreateFormula(e: React.FormEvent) {
    e.preventDefault()
    const validIngredients = selectedIngredients.filter(id => id)
    if (!formulaName || validIngredients.length === 0) return
    setLoading(true); setError('')
    try {
      await farmService.createFormula({
        name: formulaName,
        description: formulaDesc,
        unit: formulaUnit,
        ingredients: validIngredients.map(stockId => ({ stockId })),
      })
      setFormulaName(''); setFormulaDesc(''); setFormulaUnit('bags')
      setSelectedIngredients([''])
      setShowFormulaForm(false); load()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setLoading(false) }
  }

  async function handleProduceBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!batchForm.formulaId || !batchForm.qtyProduced) return
    const formula = formulas.find(f => f.id === batchForm.formulaId)
    if (!formula) return
    const ingredients = formula.ingredients
      .map(ing => ({ stockId: ing.stockId, qty: Number(batchIngredientQtys[ing.stockId] ?? 0) }))
      .filter(i => i.qty > 0)
    if (ingredients.length === 0) { setError('Enter quantities for at least one ingredient'); return }
    setLoading(true); setError('')
    try {
      await farmService.produceBatch({
        formulaId: batchForm.formulaId,
        date: batchForm.date,
        batchNo: batchForm.batchNo,
        qtyProduced: Number(batchForm.qtyProduced),
        ingredients,
        notes: batchForm.notes || undefined,
      })
      setBatchForm({ formulaId: '', date: today(), batchNo: '', qtyProduced: '', notes: '' })
      setBatchIngredientQtys({})
      setShowBatchForm(false); load(); refresh()
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
      setShowUsageForm(false); load(); refresh()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setLoading(false) }
  }

  const selectedFormula = formulas.find(f => f.id === batchForm.formulaId)
  const totalProduced = batches.reduce((s, b) => s + b.qtyProduced, 0)
  const totalRemaining = batches.reduce((s, b) => s + b.qtyRemaining, 0)

  return (
    <Shell>
      <PageHeader title="Feed Formulation" subtitle="In-house feed production, batches and usage tracking" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Formulas</div><div className="kpi-value">{formulas.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Batches produced</div><div className="kpi-value">{batches.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total remaining</div><div className="kpi-value text-brand-600">{fmtN(totalRemaining)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total produced</div><div className="kpi-value">{fmtN(totalProduced)}</div></div>
      </div>

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
                  <div className="form-group">
                    <label className="form-label">Formula name</label>
                    <input className="input" placeholder="e.g. Layers Mash A" value={formulaName} onChange={e => setFormulaName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch unit</label>
                    <select className="input" value={formulaUnit} onChange={e => setFormulaUnit(e.target.value)}>
                      {['bags', 'kg', 'litres', 'pcs'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <input className="input" placeholder="e.g. Standard laying hen formula" value={formulaDesc} onChange={e => setFormulaDesc(e.target.value)} />
                </div>

                <div>
                  <div className="section-title">Ingredients</div>
                  <p className="text-xs text-stone-400 mb-2">Just select what goes into this formula. Quantities are entered when producing each batch.</p>
                  <div className="space-y-2">
                    {selectedIngredients.map((stockId, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <select
                          className="input flex-1"
                          value={stockId}
                          onChange={e => {
                            const n = [...selectedIngredients]
                            n[i] = e.target.value
                            setSelectedIngredients(n)
                          }}
                        >
                          <option value="">— Select ingredient —</option>
                          {stockItems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                        </select>
                        <button type="button" className="btn btn-danger" onClick={() => setSelectedIngredients(selectedIngredients.filter((_, j) => j !== i))}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="btn text-xs" onClick={() => setSelectedIngredients([...selectedIngredients, ''])}>
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
            {formulas.length === 0 ? <EmptyState message="No formulas yet." /> : (
              <div className="space-y-3">
                {formulas.map(f => (
                  <div key={f.id} className="border border-stone-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-stone-900">{f.name}</div>
                        {f.description && <div className="text-xs text-stone-400 mt-0.5">{f.description}</div>}
                        <div className="text-xs text-stone-400 mt-1">Unit: <strong>{f.unit}</strong> · Batches: <strong>{f._count?.batches ?? 0}</strong></div>
                      </div>
                      {can.writeInventory && <DeleteBtn onDelete={async () => { await farmService.deleteFormula(f.id); load() }} />}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {f.ingredients.map(ing => (
                        <span key={ing.id} className="bg-stone-50 rounded-lg px-3 py-1 text-xs font-medium text-stone-700">
                          {ing.stock.name} <span className="text-stone-400">({ing.stock.unit})</span>
                        </span>
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
                  <div className="form-group">
                    <label className="form-label">Formula</label>
                    <select className="input" value={batchForm.formulaId} onChange={e => setBatchForm(f => ({ ...f, formulaId: e.target.value }))} required>
                      <option value="">— Select formula —</option>
                      {formulas.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date produced</label>
                    <input type="date" className="input" value={batchForm.date} onChange={e => setBatchForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Batch number</label>
                    <input className="input" value={batchForm.batchNo} onChange={e => setBatchForm(f => ({ ...f, batchNo: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch size ({selectedFormula?.unit ?? 'units'})</label>
                    <input type="number" className="input" placeholder="e.g. 50" value={batchForm.qtyProduced} onChange={e => setBatchForm(f => ({ ...f, qtyProduced: e.target.value }))} min={0.01} step={0.01} required />
                  </div>
                </div>

                {/* Ingredient quantities for this batch */}
                {selectedFormula && selectedFormula.ingredients.length > 0 && (
                  <div>
                    <div className="section-title">Ingredients used in this batch</div>
                    <p className="text-xs text-stone-400 mb-2">Enter how much of each ingredient was used. Leave blank to skip.</p>
                    <div className="space-y-2">
                      {selectedFormula.ingredients.map(ing => {
                        const stock = stockItems.find(s => s.id === ing.stockId)
                        return (
                          <div key={ing.id} className="flex items-center gap-3">
                            <label className="text-sm text-stone-600 w-32 flex-shrink-0">{ing.stock.name}</label>
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="number"
                                className="input"
                                placeholder={`qty in ${ing.stock.unit}`}
                                min={0}
                                step={0.01}
                                value={batchIngredientQtys[ing.stockId] ?? ''}
                                onChange={e => setBatchIngredientQtys(q => ({ ...q, [ing.stockId]: e.target.value }))}
                              />
                              <span className="text-xs text-stone-400 whitespace-nowrap">{ing.stock.unit}</span>
                            </div>
                            {stock && batchIngredientQtys[ing.stockId] && (
                              <span className={`text-xs whitespace-nowrap ${Number(batchIngredientQtys[ing.stockId]) > stock.currentQty ? 'text-red-500' : 'text-stone-400'}`}>
                                {fmtN(stock.currentQty)} available
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <input className="input" placeholder="e.g. June production run" value={batchForm.notes} onChange={e => setBatchForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Produce batch'}</button>
              </form>
            </div>
          )}

          <div className="card">
            <div className="section-title">Production batches</div>
            {batches.length === 0 ? <EmptyState message="No batches produced yet." /> : (
              <div className="space-y-3">
                {batches.map(b => {
                  const unit = b.formula?.unit ?? ''
                  const used = b.qtyProduced - b.qtyRemaining
                  const low = b.qtyRemaining === 0
                  return (
                    <div key={b.id} className={`border border-stone-100 rounded-xl p-4 ${low ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium">{b.batchNo}</span>
                          <span className="ml-2 badge badge-green">{b.formula?.name}</span>
                          <span className="ml-2 text-xs text-stone-400">{b.date?.split('T')[0]}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium text-brand-600">{fmtN(b.qtyRemaining)} {unit} left</div>
                          <div className="text-xs text-stone-400">{fmtN(used)} used of {fmtN(b.qtyProduced)}</div>
                        </div>
                      </div>
                      {(b as any).ingredients?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(b as any).ingredients.map((ing: any) => (
                            <span key={ing.id} className="bg-stone-50 rounded px-2 py-0.5 text-xs text-stone-600">
                              {ing.stock?.name}: <strong>{fmtN(ing.qty)}</strong> {ing.stock?.unit}
                              {ing.costUsed > 0 && <span className="text-stone-400"> · {fmt(ing.costUsed)}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                      {b.notes && <div className="text-xs text-stone-400 mt-1">{b.notes}</div>}
                    </div>
                  )
                })}
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
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select className="input" value={usageForm.batchId} onChange={e => setUsageForm(f => ({ ...f, batchId: e.target.value }))} required>
                      <option value="">— Select batch —</option>
                      {batches.filter(b => b.qtyRemaining > 0).map(b => (
                        <option key={b.id} value={b.id}>{b.batchNo} — {b.formula?.name} ({fmtN(b.qtyRemaining)} {b.formula?.unit} left)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date used</label>
                    <input type="date" className="input" value={usageForm.date} onChange={e => setUsageForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Qty used ({batches.find(b => b.id === usageForm.batchId)?.formula?.unit ?? 'units'})</label>
                    <input type="number" className="input" placeholder="e.g. 5" value={usageForm.qty} onChange={e => setUsageForm(f => ({ ...f, qty: e.target.value }))} min={0.01} step={0.01} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pen (optional)</label>
                    <select className="input" value={usageForm.penId} onChange={e => setUsageForm(f => ({ ...f, penId: e.target.value }))}>
                      <option value="">— Farm-wide —</option>
                      {pens.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <input className="input" placeholder="e.g. Morning feeding" value={usageForm.notes} onChange={e => setUsageForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Record usage'}</button>
              </form>
            </div>
          )}

          <div className="card">
            <div className="section-title">Usage log</div>
            {usages.length === 0 ? <EmptyState message="No usage recorded yet." /> : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Date</th><th>Batch</th><th>Formula</th><th>Qty used</th><th>Pen</th><th>Notes</th></tr></thead>
                  <tbody>
                    {usages.map(u => (
                      <tr key={u.id}>
                        <td>{u.date?.split('T')[0]}</td>
                        <td className="font-medium text-stone-600">{(u as any).batch?.batchNo ?? '—'}</td>
                        <td><span className="badge badge-green">{u.batch?.formula?.name ?? '—'}</span></td>
                        <td className="text-red-500 font-medium">{fmtN(u.qty)} <span className="text-stone-400 text-xs">{u.batch?.formula?.unit}</span></td>
                        <td className="text-stone-400">{u.pen?.name ?? 'Farm-wide'}</td>
                        <td className="text-stone-400">{u.notes || '—'}</td>
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
