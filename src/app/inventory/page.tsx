'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmt, fmtN } from '@/lib/utils'
import { Plus, AlertTriangle } from 'lucide-react'

const UNITS = ['kg', 'bags', 'vials', 'pcs', 'litres']
const initForm = { item: '', qty: '', unit: 'kg', unitPrice: '', minQty: '50', supplier: '' }

export default function InventoryPage() {
  const { inventory, addInventory, deleteInventory } = useFarmStore()
  const { can } = useRole()
  const [form, setForm] = useState(initForm)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const lowStock = inventory.filter(i => i.qty <= i.minQty)
  const totalValue = inventory.reduce((s, i) => s + i.qty * i.unitPrice, 0)

  function handleAdd() {
    if (!form.item || !form.qty) return
    addInventory({ item: form.item, qty: Number(form.qty), unit: form.unit, unitPrice: Number(form.unitPrice), minQty: Number(form.minQty), supplier: form.supplier })
    setForm(initForm)
  }

  return (
    <Shell>
      <PageHeader title="Inventory" subtitle="Feed, materials, medication and supplies" />

      {lowStock.length > 0 && (
        <div className="alert alert-warn">
          <AlertTriangle size={14} />
          {lowStock.length} item(s) below minimum stock: {lowStock.map(i => i.item).join(', ')}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total items</div><div className="kpi-value">{inventory.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Low stock alerts</div><div className={`kpi-value ${lowStock.length > 0 ? 'text-red-500' : 'text-brand-600'}`}>{lowStock.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total stock value</div><div className="kpi-value">{fmt(totalValue)}</div></div>
      </div>

      {can.writeInventory && (
      <div className="card mb-4">
        <div className="section-title">Add inventory item</div>
        <div className="form-row-3">
          <div className="form-group"><label className="form-label">Item name</label><input className="input" placeholder="e.g. Soya bean meal" value={form.item} onChange={e => set('item', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Quantity</label><input type="number" className="input" value={form.qty} onChange={e => set('qty', e.target.value)} /></div>
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

      <div className="card">
        <div className="section-title">Stock levels</div>
        {inventory.length === 0 ? <EmptyState /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Item</th><th>In stock</th><th>Min level</th><th>Unit price</th><th>Total value</th><th>Supplier</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {inventory.map(r => {
                  const low = r.qty <= r.minQty
                  return (
                    <tr key={r.id}>
                      <td className="font-medium">{r.item}</td>
                      <td>{fmtN(r.qty)} {r.unit}</td>
                      <td className="text-stone-400">{fmtN(r.minQty)} {r.unit}</td>
                      <td>{fmt(r.unitPrice)}</td>
                      <td className="font-medium">{fmt(r.qty * r.unitPrice)}</td>
                      <td className="text-stone-400">{r.supplier || '—'}</td>
                      <td><span className={`badge ${low ? 'badge-red' : 'badge-green'}`}>{low ? 'Low stock' : 'OK'}</span></td>
                      <td>{can.writeInventory && <DeleteBtn onDelete={() => deleteInventory(r.id)} />}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  )
}
