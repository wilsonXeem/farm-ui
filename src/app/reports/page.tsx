'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import { useFarmStore } from '@/store/farmStore'
import { useStaffPens } from '@/hooks/useStaffPens'
import { fmt, fmtN, getLast7Days } from '@/lib/utils'
import { Printer } from 'lucide-react'

type ReportMode = 'daily' | 'weekly' | 'monthly'

function getLast4Weeks(): { label: string; dates: string[] }[] {
  const now = new Date()
  return Array.from({ length: 4 }, (_, w) => {
    const dates: string[] = []
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(now)
      dt.setDate(dt.getDate() - w * 7 - d)
      dates.push(dt.toISOString().split('T')[0])
    }
    return { label: `Week of ${dates[0]}`, dates }
  }).reverse()
}

function getLast3Months(): { label: string; dates: string[] }[] {
  const now = new Date()
  return Array.from({ length: 3 }, (_, m) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (2 - m), 1)
    const label = dt.toLocaleString('en-NG', { month: 'long', year: 'numeric' })
    const yr = dt.getFullYear(), mo = dt.getMonth()
    const daysInMonth = new Date(yr, mo + 1, 0).getDate()
    const dates = Array.from({ length: daysInMonth }, (_, d) =>
      `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`)
    return { label, dates }
  })
}

export default function ReportsPage() {
  const { expenses, sales } = useFarmStore()
  const { myProduction: production, myMortality: mortality, myPens, isStaff } = useStaffPens()
  const [mode, setMode] = useState<ReportMode>('daily')

  const subtitle = isStaff && myPens.length > 0
    ? `Your pens: ${myPens.map(p => p.name).join(', ')}`
    : 'Daily, weekly, and monthly summaries'

  const periods = mode === 'daily'
    ? getLast7Days().map(d => ({ label: d, dates: [d] }))
    : mode === 'weekly' ? getLast4Weeks()
    : getLast3Months()

  const rows = periods.map(p => {
    const eggs = production.filter(r => p.dates.includes(r.date)).reduce((s, r) => s + r.goodEggs, 0)
    const exp = isStaff ? 0 : expenses.filter(r => p.dates.includes(r.date)).reduce((s, r) => s + r.amount, 0)
    const rev = isStaff ? 0 : sales.filter(r => p.dates.includes(r.date)).reduce((s, r) => s + r.total, 0)
    const mort = mortality.filter(r => p.dates.includes(r.date)).reduce((s, r) => s + r.count, 0)
    return { ...p, eggs, exp, rev, mort, profit: rev - exp }
  })

  const totalEggs = rows.reduce((s, r) => s + r.eggs, 0)
  const totalExp = rows.reduce((s, r) => s + r.exp, 0)
  const totalRev = rows.reduce((s, r) => s + r.rev, 0)
  const totalProfit = totalRev - totalExp

  return (
    <Shell>
      <PageHeader title="Reports" subtitle={subtitle} />

      <div className="flex gap-2 mb-5">
        {(['daily', 'weekly', 'monthly'] as ReportMode[]).map(m => (
          <button key={m} className={`btn ${mode === m ? 'btn-primary' : ''}`} onClick={() => setMode(m)}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        <button className="btn ml-auto" onClick={() => window.print()}>
          <Printer size={14} /> Export / Print
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Good eggs</div><div className="kpi-value">{fmtN(totalEggs)}</div></div>
        {!isStaff && <>
          <div className="kpi-card"><div className="kpi-label">Total expenses</div><div className="kpi-value text-red-500">{fmt(totalExp)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total revenue</div><div className="kpi-value text-brand-600">{fmt(totalRev)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Net profit / loss</div><div className={`kpi-value ${totalProfit >= 0 ? 'text-brand-600' : 'text-red-500'}`}>{totalProfit < 0 ? '-' : ''}{fmt(Math.abs(totalProfit))}</div></div>
        </>}
        {isStaff && (
          <div className="kpi-card"><div className="kpi-label">Total mortality</div><div className="kpi-value text-red-500">{fmtN(rows.reduce((s, r) => s + r.mort, 0))}</div></div>
        )}
      </div>

      <div className="card">
        <div className="section-title">{mode.charAt(0).toUpperCase() + mode.slice(1)} breakdown</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Period</th>
                <th>Good eggs</th>
                {!isStaff && <><th>Expenses</th><th>Revenue</th><th>Profit / loss</th></>}
                <th>Mortality</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.label}>
                  <td className="font-medium">{r.label}</td>
                  <td>{fmtN(r.eggs)}</td>
                  {!isStaff && <>
                    <td className="text-red-400">{fmt(r.exp)}</td>
                    <td className="text-brand-600">{fmt(r.rev)}</td>
                    <td>
                      <span className={`badge ${r.profit > 0 ? 'badge-green' : r.profit < 0 ? 'badge-red' : 'badge-gray'}`}>
                        {r.profit < 0 ? '-' : ''}{fmt(Math.abs(r.profit))}
                      </span>
                    </td>
                  </>}
                  <td>{r.mort > 0 ? <span className="text-red-400">{r.mort}</span> : <span className="text-stone-300">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  )
}
