'use client'
import { useState, useEffect } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { farmService } from '@/services/farmService'
import { fmt, fmtN, today } from '@/lib/utils'
import { Plus, AlertTriangle, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react'
import type { StockMovement } from '@/types'

const UNITS = ['kg', 'bags', 'vials', 'pcs', 'litres', 'crates']
const initForm = { item: '', qty: '', unit: 'kg', unitPrice: '', minQty: '50', supplier: '' }

interface MovementModalProps {
  type: 'IN' | 'OUT'
  item: { id: string; item: string; qty: number; unit: string }
  onClose: () => void
  onDone: (id: string, newQty: number) => void
}

function MovementModal({ type, item, onClose, onDone }: MovementModalProps) {
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!qty || Number(qty) <= 0) return
    setLoading(true)
    setError('')
    try {
      const updated = type === 'IN'
        ? await farmService.stockIn(item.id, Number(qty), reason)
        : await farmService.stockOut(item.id, Number(qty), reason)
      onDone(item.id, updated.qty)
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          {type === 'IN'
            ? <ArrowUpCircle size={20} className="text-brand-600" />
            : <ArrowDownCircle size={20} className="text-red-500" />}
          <h2 className="font-medium text-stone-900">
            {type === 'IN' ? 'Stock In' : 'Stock Out'} — {item.item}
          </h2>
        </div>
        <p className="text-xs text-stone-400 mb-4">Current stock: <strong>{fmtN(item.qty)} {item.unit}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-group">
            <label className="form-label">Quantity ({item.unit})</label>
            <input type="number" className="input" placeholder="e.g. 50" value={qty} onChange={e => setQty(e.target.value)} autoFocus min={0.01} step={0.01} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reason {type === 'OUT' ? '(e.g. Daily feed — Pen 1)' : '(e.g. Restocking)'}</label>
            <input className="input" placeholder="Optional" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          {error && <div className="alert alert-danger py-2 text-xs">{error}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn flex-1 ${type === 'IN' ? 'btn-primary' : 'bg-red-500 text-white border-red-500 hover:bg-red-600'}`} disabled={loading}>
              {loading ? 'Saving...' : type === 'IN' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const { inventory, addInventory, deleteInventory } = useFarmStore()
  const { can } = useRole()
  const [form, setForm] = useState(initForm)
  const [modal, setModal] = useState<{ type: 'IN' | 'OUT'; item: any } | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [localQty, setLocalQty] = useState<Record<string, number>>({})
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const lowStock = inventory.filter(i => i.qty <= i.minQty)
  const totalValue = inventory.reduce((s, i) => s + i.qty * i.unitPrice, 0)

  function getQty(id: string, fallback: number) {
    return localQty[id] !== undefined ? localQty[id] : fallback
  }

  function handleAdd() {
    if (!form.item || !form.qty) return
    addInventory({ item: form.item, qty: Number(form.qty), unit: form.unit, unitPrice: Number(form.unitPrice), minQty: Number(form.minQty), supplier: form.supplier })
    setForm(initForm)
  }

  function handleMovementDone(id: string, newQty: number) {
    setLocalQty(prev => ({ ...prev, [id]: newQty }))
  }

  async function loadMovements(inventoryId?: string) {
    const data = await farmService.getMovements(inventoryId)
    setMovements(data as any)
    setSelectedItem(inventoryId ?? null)
    setShowHistory(true)
  }

  const displayedMovements = selectedItem
    ? movements.filter(m => m.inventoryId === selectedItem)
    : movements

  return (
    <Shell>
      <PageHeader title="Inventory" subtitle="Stock levels, movements and alerts" />

      {lowStock.length > 0 && (
        <div className="alert alert-warn mb-4">
          <AlertTriangle size={14} />
          <strong>Low stock alert:</strong> {lowStock.map(i => `${i.item} (${getQty(i.id, i.qty)} ${i.unit})`).join(', ')}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total items</div><div className="kpi-value">{inventory.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Low stock alerts</div><div className={`kpi-value ${lowStock.length > 0 ? 'text-red-500' : 'text-brand-600'}`}>{lowStock.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total stock value</div><div className="kpi-value">{fmt(totalValue)}</div></div>
      </div>

      {can.writeInventory && (
        <div className="card mb-4">
          <div className="section-title">Add inventory item</div>
          <div className="form-row-3">
            <div className="form-group"><label className="form-label">Item name</label><input className="input" placeholder="e.g. Soya bean meal" value={form.item} onChange={e => set('item', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Opening qty</label><input type="number" className="input" value={form.qty} onChange={e => set('qty', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Unit</label><select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
          </div>
          <div className="form-row-3">
            <div className="form-group"><label className="form-label">Unit price (₦)</label><input type="number" className="input" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Min stock alert</label><input type="number" className="input" value={form.minQty} onChange={e => set('minQty', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Supplier</label><input className="input" value={form.supplier} onChange={e => set('supplier', e.target.value)} /></div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}><Plus size={14} /> Add item</button>
        </div>
      )}

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title mb-0">Stock levels</div>
          <button className="btn text-xs" onClick={() => loadMovements()}>
            <History size={13} /> View all movements
          </button>
        </div>
        {inventory.length === 0 ? <EmptyState /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Item</th><th>In stock</th><th>Min level</th><th>Unit price</th><th>Value</th><th>Supplier</th><th>Status</th><th>Actions</th><th></th></tr>
              </thead>
              <tbody>
                {inventory.map(r => {
                  const qty = getQty(r.id, r.qty)
                  const low = qty <= r.minQty
                  return (
                    <tr key={r.id} className={low ? 'bg-red-50/50' : ''}>
                      <td className="font-medium">{r.item}</td>
                      <td className={low ? 'text-red-600 font-medium' : ''}>{fmtN(qty)} {r.unit}</td>
                      <td className="text-stone-400">{fmtN(r.minQty)} {r.unit}</td>
                      <td>{fmt(r.unitPrice)}</td>
                      <td className="font-medium">{fmt(qty * r.unitPrice)}</td>
                      <td className="text-stone-400">{r.supplier || '—'}</td>
                      <td>
                        <span className={`badge ${low ? 'badge-red' : 'badge-green'}`}>
                          {low ? '⚠ Low stock' : 'OK'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {can.writeInventory && (
                            <button className="btn text-xs py-1 px-2 text-brand-600" onClick={() => setModal({ type: 'IN', item: { ...r, qty } })}>
                              <ArrowUpCircle size={12} /> In
                            </button>
                          )}
                          {(can.writeInventory || can.writeSales) && (
                            <button className="btn text-xs py-1 px-2 text-red-500" onClick={() => setModal({ type: 'OUT', item: { ...r, qty } })}>
                              <ArrowDownCircle size={12} /> Out
                            </button>
                          )}
                          <button className="btn text-xs py-1 px-2" onClick={() => loadMovements(r.id)}>
                            <History size={12} />
                          </button>
                        </div>
                      </td>
                      <td>{can.writeInventory && <DeleteBtn onDelete={() => deleteInventory(r.id)} />}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movement history panel */}
      {showHistory && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title mb-0">
              {selectedItem ? `Movement history — ${inventory.find(i => i.id === selectedItem)?.item}` : 'All stock movements'}
            </div>
            <div className="flex gap-2">
              {selectedItem && <button className="btn text-xs" onClick={() => { setSelectedItem(null); loadMovements() }}>Show all</button>}
              <button className="btn text-xs" onClick={() => setShowHistory(false)}>Close</button>
            </div>
          </div>
          {displayedMovements.length === 0 ? <EmptyState message="No movements recorded yet." /> : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Quantity</th><th>Reason</th></tr></thead>
                <tbody>
                  {displayedMovements.map((m: any) => (
                    <tr key={m.id}>
                      <td>{m.date?.split('T')[0] ?? m.date}</td>
                      <td className="font-medium">{m.inventory?.item ?? '—'}</td>
                      <td>
                        <span className={`badge ${m.type === 'IN' ? 'badge-green' : 'badge-red'}`}>
                          {m.type === 'IN' ? '↑ Stock In' : '↓ Stock Out'}
                        </span>
                      </td>
                      <td className={m.type === 'IN' ? 'text-brand-600 font-medium' : 'text-red-500 font-medium'}>
                        {m.type === 'IN' ? '+' : '-'}{fmtN(m.qty)} {m.inventory?.unit ?? ''}
                      </td>
                      <td className="text-stone-400">{m.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && (
        <MovementModal
          type={modal.type}
          item={modal.item}
          onClose={() => setModal(null)}
          onDone={handleMovementDone}
        />
      )}
    </Shell>
  )
}
