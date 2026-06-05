'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmt, today } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { ExpenseCategory } from '@/types'

const CATEGORIES: ExpenseCategory[] = ['Fuel', 'Construction', 'Salary', 'Medication', 'Repairs', 'Transport', 'Electricity', 'Water', 'Miscellaneous']
const initForm = { date: today(), category: 'Fuel' as ExpenseCategory, amount: '', description: '', receipt: '' as string }

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useFarmStore()
  const { can } = useRole()
  const [form, setForm] = useState(initForm)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const total = expenses.reduce((s, r) => s + r.amount, 0)

  function handleAdd() {
    if (!form.date || !form.amount) return
    addExpense({ date: form.date, category: form.category, amount: Number(form.amount), description: form.description })
    setForm(initForm)
  }

  const byCategory = CATEGORIES.map(c => ({
    cat: c,
    total: expenses.filter(e => e.category === c).reduce((s, r) => s + r.amount, 0),
  })).filter(x => x.total > 0)

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Shell>
      <PageHeader title="Expenses" subtitle="All operational costs" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total expenses</div><div className="kpi-value text-red-500">{fmt(total)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Records</div><div className="kpi-value">{expenses.length}</div></div>
        {byCategory.slice(0, 2).map(x => (
          <div key={x.cat} className="kpi-card"><div className="kpi-label">{x.cat}</div><div className="kpi-value">{fmt(x.total)}</div></div>
        ))}
      </div>

      {can.writeExpenses && (
      <div className="card mb-4">
        <div className="section-title">Add expense</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Amount (₦)</label><input type="number" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description</label><input className="input" placeholder="Details..." value={form.description} onChange={e => set('description', e.target.value)} /></div>
        </div>
        <div className="form-group mb-3">
          <label className="form-label">Receipt (optional)</label>
          <input type="file" accept="image/*,application/pdf" className="input py-1.5 text-xs"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => set('receipt', reader.result as string)
              reader.readAsDataURL(file)
            }} />
        </div>
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={14} /> Add expense</button>
      </div>
      )}

      <div className="card">
        <div className="section-title">Expense records</div>
        {sorted.length === 0 ? <EmptyState /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th></th></tr></thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td><span className="badge badge-amber">{r.category}</span></td>
                    <td className="font-medium text-red-500">{fmt(r.amount)}</td>
                    <td className="text-stone-400">{r.description || '—'}</td>
                    <td>{can.writeExpenses && <DeleteBtn onDelete={() => deleteExpense(r.id)} />}</td>
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
