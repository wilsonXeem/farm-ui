'use client'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { useFarmStore } from '@/store/farmStore'
import { fmt, fmtN, today, currentMonth, getInitials } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

export default function PayrollPage() {
  const { workers, payroll, addPayroll } = useFarmStore()
  const thisMonth = currentMonth()
  const paidThisMonth = payroll.filter(p => p.month === thisMonth)
  const totalPayable = workers.reduce((s, w) => s + w.salary, 0)
  const totalPaid = paidThisMonth.reduce((s, p) => s + p.amount, 0)
  const outstanding = totalPayable - totalPaid

  function markPaid(workerId: string) {
    const w = workers.find(x => x.id === workerId)
    if (!w || paidThisMonth.some(p => p.workerId === workerId)) return
    addPayroll({ workerId, workerName: w.name, amount: w.salary, month: thisMonth, date: today() })
  }

  const monthLabel = new Date().toLocaleString('en-NG', { month: 'long', year: 'numeric' })
  const recentHistory = [...payroll].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20)

  return (
    <Shell>
      <PageHeader title="Payroll" subtitle={`Salary payments — ${monthLabel}`} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total payable</div><div className="kpi-value">{fmt(totalPayable)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Paid this month</div><div className="kpi-value text-brand-600">{fmt(totalPaid)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Outstanding</div><div className={`kpi-value ${outstanding > 0 ? 'text-red-500' : 'text-brand-600'}`}>{fmt(outstanding)}</div></div>
      </div>

      <div className="card mb-4">
        <div className="section-title">Staff salary status — {monthLabel}</div>
        {workers.length === 0 ? <EmptyState message="No workers added." /> : (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Salary</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {workers.map(w => {
                const isPaid = paidThisMonth.some(p => p.workerId === w.id)
                return (
                  <tr key={w.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-medium">{getInitials(w.name)}</div>
                        {w.name}
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{w.role}</span></td>
                    <td className="font-medium">{fmt(w.salary)}</td>
                    <td><span className={`badge ${isPaid ? 'badge-green' : 'badge-red'}`}>{isPaid ? 'Paid' : 'Unpaid'}</span></td>
                    <td>
                      {!isPaid && (
                        <button className="btn btn-primary text-xs py-1 px-3" onClick={() => markPaid(w.id)}>
                          <CheckCircle size={12} /> Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="section-title">Payment history</div>
        {recentHistory.length === 0 ? <EmptyState message="No payment history." /> : (
          <table className="tbl">
            <thead><tr><th>Date</th><th>Worker</th><th>Amount</th><th>Month</th><th>Status</th></tr></thead>
            <tbody>
              {recentHistory.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td className="font-medium">{r.workerName}</td>
                  <td>{fmt(r.amount)}</td>
                  <td className="text-stone-400">{r.month}</td>
                  <td><span className="badge badge-green">Paid</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  )
}
