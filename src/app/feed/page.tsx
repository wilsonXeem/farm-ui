'use client'
import { useState, useEffect } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmt, fmtN, today } from '@/lib/utils'
import { Plus } from 'lucide-react'

const initForm = { date: today(), item: '', qty: '', unitPrice: '', totalCost: '', supplier: '' }

export default function FeedPage() {
  const { feed, addFeed, deleteFeed } = useFarmStore()
  const { can } = useRole()
  const [form, setForm] = useState(initForm)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const q = Number(form.qty), p = Number(form.unitPrice)
    if (q && p) setForm(f => ({ ...f, totalCost: String(q * p) }))
  }, [form.qty, form.unitPrice])

  const total = feed.reduce((s, r) => s + r.totalCost, 0)

  function handleAdd() {
    if (!form.date || !form.item || !form.qty) return
    addFeed({ date: form.date, item: form.item, qty: Number(form.qty), unitPrice: Number(form.unitPrice), totalCost: Number(form.totalCost) || Number(form.qty) * Number(form.unitPrice), supplier: form.supplier })
    setForm(initForm)
  }

  const sorted = [...feed].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Shell>
      <PageHeader title="Feed costs" subtitle="Track feed purchases and supplier prices" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total feed spend</div><div className="kpi-value text-red-500">{fmt(total)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Purchase records</div><div className="kpi-value">{feed.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Avg per purchase</div><div className="kpi-value">{feed.length > 0 ? fmt(total / feed.length) : '—'}</div></div>
      </div>

      {can.writeFeed && (
      <div className="card mb-4">
        <div className="section-title">Record feed purchase</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Item name</label><input className="input" placeholder="e.g. Dry maize" value={form.item} onChange={e => set('item', e.target.value)} /></div>
        </div>
        <div className="form-row-3">
          <div className="form-group"><label className="form-label">Quantity (kg/bags)</label><input type="number" className="input" value={form.qty} onChange={e => set('qty', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Unit price (₦)</label><input type="number" className="input" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Total cost (₦)</label><input type="number" className="input" placeholder="Auto-calculated" value={form.totalCost} onChange={e => set('totalCost', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Supplier</label><input className="input" value={form.supplier} onChange={e => set('supplier', e.target.value)} /></div>
          <div className="flex items-end"><button className="btn btn-primary w-full" onClick={handleAdd}><Plus size={14} /> Add purchase</button></div>
        </div>
      </div>
      )}

      <div className="card">
        <div className="section-title">Purchase history</div>
        {sorted.length === 0 ? <EmptyState /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Item</th><th>Qty</th><th>Unit price</th><th>Total cost</th><th>Supplier</th><th></th></tr></thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id}>
                    <td>{r.date}</td><td className="font-medium">{r.item}</td><td>{fmtN(r.qty)}</td>
                    <td>{fmt(r.unitPrice)}</td><td className="font-medium text-red-500">{fmt(r.totalCost)}</td>
                    <td className="text-stone-400">{r.supplier || '—'}</td>
                    <td>{can.writeFeed && <DeleteBtn onDelete={() => deleteFeed(r.id)} />}</td>
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
