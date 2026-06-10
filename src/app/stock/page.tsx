'use client'
import { useState, useEffect, useCallback } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { farmService } from '@/services/farmService'
import { fmt, fmtN, today } from '@/lib/utils'
import { Plus, AlertTriangle, ArrowUpCircle, ArrowDownCircle, History, Package, Loader2 } from 'lucide-react'
import type { StockItem, StockBatch, StockOut } from '@/types'

const CATEGORIES = ['Feed', 'Medication', 'Equipment', 'Supplies', 'Other']
const CAT_RMAP: Record<string, string> = {
  Feed: 'FEED', Medication: 'MEDICATION', Equipment: 'EQUIPMENT',
  Supplies: 'SUPPLIES', Other: 'OTHER',
}
const CAT_MAP: Record<string, string> = Object.fromEntries(Object.entries(CAT_RMAP).map(([k, v]) => [v, k]))
const CAT_COLORS: Record<string, string> = {
  Feed: 'badge-green', Medication: 'badge-red', Equipment: 'badge-blue',
  Supplies: 'badge-amber', Other: 'badge-gray',
}

const initItemForm = { name: '', category: 'Feed', unit: 'kg', minQty: '0', supplier: '' }

function StockInModal({ item, onClose, onDone }: { item: StockItem; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ date: today(), qty: '', unitPrice: '', supplier: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.qty || !form.unitPrice) return
    setLoading(true); setError('')
    try {
      await farmService.stockIn({ stockId: item.id, date: form.date, qty: Number(form.qty), unitPrice: Number(form.unitPrice), supplier: form.supplier || undefined, notes: form.notes || undefined })
      onDone(); onClose()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1"><ArrowUpCircle size={18} className="text-brand-600" /><h2 className="font-medium">Stock In — {item.name}</h2></div>
        <p className="text-xs text-stone-400 mb-4">Current: <strong>{fmtN(item.currentQty)} {item.unit}</strong> · FIFO cost: <strong>{fmt(item.fifoCostPerUnit)}/{item.unit}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Qty ({item.unit})</label><input type="number" className="input" placeholder="e.g. 500" value={form.qty} onChange={e => set('qty', e.target.value)} min={0.01} step={0.01} required autoFocus /></div>
            <div className="form-group"><label className="form-label">Unit price (₦/{item.unit})</label><input type="number" className="input" placeholder="e.g. 280" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} min={0} required /></div>
          </div>
          {form.qty && form.unitPrice && (
            <div className="bg-brand-50 rounded-lg px-3 py-2 text-sm text-brand-800">Batch total: <strong>{fmt(Number(form.qty) * Number(form.unitPrice))}</strong></div>
          )}
          <div className="form-group"><label className="form-label">Supplier (optional)</label><input className="input" value={form.supplier} onChange={e => set('supplier', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Notes (optional)</label><input className="input" placeholder="e.g. New delivery" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          {error && <div className="alert alert-danger py-2 text-xs">{error}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Add Stock'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StockOutModal({ item, pens, onClose, onDone }: { item: StockItem; pens: any[]; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ date: today(), qty: '', reason: '', penId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.qty) return
    setLoading(true); setError('')
    try {
      await farmService.stockOut({ stockId: item.id, date: form.date, qty: Number(form.qty), reason: form.reason || undefined, penId: form.penId || undefined })
      onDone(); onClose()
    } catch (e: any) { setError(e.message ?? 'Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1"><ArrowDownCircle size={18} className="text-red-500" /><h2 className="font-medium">Stock Out — {item.name}</h2></div>
        <p className="text-xs text-stone-400 mb-4">Available: <strong>{fmtN(item.currentQty)} {item.unit}</strong> · FIFO cost: <strong>{fmt(item.fifoCostPerUnit)}/{item.unit}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="form-group">
            <label className="form-label">Quantity used ({item.unit})</label>
            <input type="number" className="input" placeholder={`Max: ${fmtN(item.currentQty)}`} value={form.qty} onChange={e => set('qty', e.target.value)} min={0.01} max={item.currentQty} step={0.01} required autoFocus />
          </div>
          {form.qty && Number(form.qty) > 0 && (
            <div className="bg-red-50 rounded-lg px-3 py-2 text-sm text-red-700">FIFO cost of usage: <strong>{fmt(Number(form.qty) * item.fifoCostPerUnit)}</strong></div>
          )}
          <div className="form-group">
            <label className="form-label">Pen (optional)</label>
            <select className="input" value={form.penId} onChange={e => set('penId', e.target.value)}>
              <option value="">— Farm-wide —</option>
              {pens.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Reason (e.g. Morning feed — Pen 1)</label><input className="input" value={form.reason} onChange={e => set('reason', e.target.value)} /></div>
          {error && <div className="alert alert-danger py-2 text-xs">{error}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="bg-red-500 text-white border-red-500 hover:bg-red-600 btn flex-1" disabled={loading}>{loading ? 'Saving...' : 'Remove Stock'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StockPage() {
  const { pens } = useFarmStore()
  const { refresh } = useFarmStore() as any
  const { can } = useRole()
  const [items, setItems] = useState<StockItem[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [batches, setBatches] = useState<StockBatch[]>([])
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [modal, setModal] = useState<'in' | 'out' | 'batches' | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [form, setForm] = useState(initItemForm)
  const [tab, setTab] = useState<'stock' | 'movements'>('stock')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const loadItems = useCallback(async () => {
    try {
      const data = await farmService.getStock()
      setItems(data.map((r: any) => ({ ...r, category: CAT_MAP[r.category] ?? r.category })))
    } catch (e) { console.error(e) }
  }, [])

  const loadMovements = useCallback(async (stockId?: string) => {
    try {
      const data = await farmService.getStockMovements(stockId)
      setMovements(data as any[])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  async function handleAddItem() {
    if (!form.name || !form.unit) return
    setSavingItem(true)
    try {
      await farmService.createStock({ name: form.name, category: CAT_RMAP[form.category], unit: form.unit, minQty: Number(form.minQty), supplier: form.supplier || undefined })
      setForm(initItemForm); setAddingItem(false); loadItems(); refresh()
    } finally { setSavingItem(false) }
  }

  async function showBatches(item: StockItem) {
    const data = await farmService.getStockBatches(item.id)
    setBatches(data as any); setSelectedItem(item); setModal('batches')
  }

  const lowStock = items.filter(i => i.currentQty <= i.minQty)
  const totalValue = items.reduce((s, i) => s + i.totalValue, 0)

  return (
    <Shell>
      <PageHeader title="Stock & Inventory" subtitle="FIFO costing — oldest batch consumed first" />

      {lowStock.length > 0 && (
        <div className="alert alert-warn mb-4">
          <AlertTriangle size={14} />
          <strong>Low stock:</strong> {lowStock.map(i => `${i.name} (${fmtN(i.currentQty)} ${i.unit})`).join(', ')}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Stock items</div><div className="kpi-value">{items.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Low stock alerts</div><div className={`kpi-value ${lowStock.length > 0 ? 'text-red-500' : 'text-brand-600'}`}>{lowStock.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total stock value</div><div className="kpi-value">{fmt(totalValue)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Feed value</div><div className="kpi-value">{fmt(items.filter(i => i.category === 'Feed').reduce((s, i) => s + i.totalValue, 0))}</div></div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={`btn ${tab === 'stock' ? 'btn-primary' : ''}`} onClick={() => setTab('stock')}><Package size={14} /> Stock items</button>
        <button className={`btn ${tab === 'movements' ? 'btn-primary' : ''}`} onClick={() => { setTab('movements'); setSelectedItem(null); loadMovements() }}><History size={14} /> Movement log</button>
        {can.writeInventory && <button className="btn btn-primary ml-auto" onClick={() => setAddingItem(!addingItem)}><Plus size={14} /> Add item</button>}
      </div>

      {addingItem && can.writeInventory && (
        <div className="card mb-4">
          <div className="section-title">New stock item</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Item name</label><input className="input" placeholder="e.g. Dry maize" value={form.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
            <div className="form-group"><label className="form-label">Category</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group"><label className="form-label">Unit</label><input className="input" placeholder="kg, bags, vials, litres..." value={form.unit} onChange={e => set('unit', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Min qty alert</label><input type="number" className="input" value={form.minQty} onChange={e => set('minQty', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Default supplier</label><input className="input" value={form.supplier} onChange={e => set('supplier', e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleAddItem} disabled={savingItem}>
              {savingItem ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save
            </button>
            <button className="btn" onClick={() => setAddingItem(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* STOCK ITEMS */}
      {tab === 'stock' && (
        <div className="card">
          <div className="section-title">Current stock levels</div>
          {items.length === 0 ? <EmptyState message="No stock items yet." /> : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Item</th><th>Category</th><th>In stock</th><th>Min level</th><th>FIFO cost/unit</th><th>Avg cost/unit</th><th>Stock value</th><th>Status</th><th>Added</th><th>Actions</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const low = item.currentQty <= item.minQty
                    return (
                      <tr key={item.id} className={low ? 'bg-red-50/40' : ''}>
                        <td className="font-medium">{item.name}</td>
                        <td><span className={`badge ${CAT_COLORS[item.category] ?? 'badge-gray'}`}>{item.category}</span></td>
                        <td className={`font-medium ${low ? 'text-red-600' : ''}`}>{fmtN(item.currentQty)} <span className="text-stone-400 text-xs">{item.unit}</span></td>
                        <td className="text-stone-400">{fmtN(item.minQty)} {item.unit}</td>
                        <td className="font-medium">{item.fifoCostPerUnit > 0 ? `${fmt(item.fifoCostPerUnit)}` : '—'}</td>
                        <td className="text-stone-400 text-xs">{item.avgCostPerUnit > 0 ? fmt(item.avgCostPerUnit) : '—'}</td>
                        <td className="font-medium text-brand-600">{fmt(item.totalValue)}</td>
                        <td><span className={`badge ${low ? 'badge-red' : 'badge-green'}`}>{low ? '⚠ Low' : 'OK'}</span></td>
                        <td className="text-stone-400 text-xs">{item.createdAt?.split('T')[0]}</td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {can.writeInventory && (
                              <button className="btn text-xs py-1 px-2 text-brand-600" onClick={() => { setSelectedItem(item); setModal('in') }}>
                                <ArrowUpCircle size={11} /> In
                              </button>
                            )}
                            {(can.writeInventory || can.writeSales) && (
                              <button className="btn text-xs py-1 px-2 text-red-500" onClick={() => { setSelectedItem(item); setModal('out') }}>
                                <ArrowDownCircle size={11} /> Out
                              </button>
                            )}
                            <button className="btn text-xs py-1 px-2" onClick={() => showBatches(item)}>
                              <History size={11} /> Batches
                            </button>
                          </div>
                        </td>
                        <td>{can.deleteInventory && <DeleteBtn onDelete={async () => { await farmService.deleteStock(item.id); loadItems(); refresh() }} />}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MOVEMENT LOG */}
      {tab === 'movements' && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title mb-0">{selectedItem ? `Movements — ${selectedItem.name}` : 'All stock movements'}</div>
            {selectedItem && <button className="btn text-xs" onClick={() => { setSelectedItem(null); loadMovements() }}>Show all</button>}
          </div>
          {movements.length === 0 ? <EmptyState message="No movements recorded yet." /> : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Date</th><th>Item</th><th>Qty used</th><th>FIFO cost</th><th>Pen</th><th>Reason</th><th>Recorded at</th></tr></thead>
                <tbody>
                  {movements.map((m: any) => (
                    <tr key={m.id}>
                      <td>{m.date?.split('T')[0]}</td>
                      <td className="font-medium">{m.stock?.name ?? '—'}</td>
                      <td className="text-red-500 font-medium">-{fmtN(m.qty)} <span className="text-stone-400 text-xs">{m.stock?.unit}</span></td>
                      <td>{fmt(m.costUsed)}</td>
                      <td className="text-stone-400">{m.pen?.name ?? 'Farm-wide'}</td>
                      <td className="text-stone-400">{m.reason || '—'}</td>
                      <td className="text-stone-400 text-xs">{m.createdAt ? new Date(m.createdAt).toLocaleString('en-NG') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BATCH HISTORY MODAL */}
      {modal === 'batches' && selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-medium mb-0.5">Price history — {selectedItem.name}</h2>
            <p className="text-xs text-stone-400 mb-4">Oldest batch consumed first (FIFO). Greyed rows = fully consumed.</p>
            <div className="tbl-wrap max-h-80 overflow-y-auto">
              <table className="tbl">
                <thead><tr><th>Date</th><th>Qty in</th><th>Remaining</th><th>Unit price</th><th>Batch total</th><th>Supplier</th><th>Notes</th><th>Recorded at</th></tr></thead>
                <tbody>
                  {batches.length === 0
                    ? <tr><td colSpan={8} className="text-center text-stone-400 py-4">No batches yet.</td></tr>
                    : batches.map((b: any) => (
                      <tr key={b.id} className={b.remainingQty === 0 ? 'opacity-40' : ''}>
                        <td>{b.date?.split('T')[0]}</td>
                        <td>{fmtN(b.qty)} <span className="text-stone-400 text-xs">{selectedItem.unit}</span></td>
                        <td className={b.remainingQty === 0 ? 'text-stone-300' : 'text-brand-600 font-medium'}>{fmtN(b.remainingQty)}</td>
                        <td className="font-medium">{fmt(b.unitPrice)}/{selectedItem.unit}</td>
                        <td>{fmt(b.totalCost)}</td>
                        <td className="text-stone-400">{b.supplier || '—'}</td>
                        <td className="text-stone-400">{b.notes || '—'}</td>
                        <td className="text-stone-400 text-xs">{b.createdAt ? new Date(b.createdAt).toLocaleString('en-NG') : '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <button className="btn mt-4" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}

      {modal === 'in' && selectedItem && <StockInModal item={selectedItem} onClose={() => setModal(null)} onDone={() => { loadItems(); refresh() }} />}
      {modal === 'out' && selectedItem && <StockOutModal item={selectedItem} pens={pens} onClose={() => setModal(null)} onDone={() => { loadItems(); refresh() }} />}
    </Shell>
  )
}
