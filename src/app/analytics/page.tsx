'use client'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import { useFarmStore } from '@/store/farmStore'
import { useStaffPens } from '@/hooks/useStaffPens'
import { fmt, fmtN, getLast7Days } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

export default function AnalyticsPage() {
  const { expenses, feed, sales, workers } = useFarmStore()
  const { myProduction: production, myMortality: mortality, myPens, isStaff } = useStaffPens()
  const last7 = getLast7Days()

  const subtitle = isStaff && myPens.length > 0
    ? `Your pens: ${myPens.map(p => p.name).join(', ')}`
    : 'Visual trends across all farm operations'

  const prodData = last7.map(d => ({
    date: d.slice(5),
    good: production.filter(r => r.date === d).reduce((s, r) => s + r.goodEggs, 0),
    cracked: production.filter(r => r.date === d).reduce((s, r) => s + r.crackedEggs, 0),
    spoilt: production.filter(r => r.date === d).reduce((s, r) => s + r.spoiltEggs, 0),
  }))

  const financeData = last7.map(d => {
    const rev = sales.filter(r => r.date === d).reduce((s, r) => s + r.total, 0)
    const exp = expenses.filter(r => r.date === d).reduce((s, r) => s + r.amount, 0)
    return { date: d.slice(5), revenue: rev, expenses: exp, profit: rev - exp }
  })

  const mortalityData = last7.map(d => ({
    date: d.slice(5),
    deaths: mortality.filter(r => r.date === d).reduce((s, r) => s + r.count, 0),
  }))

  const salaryCost = workers.reduce((s, w) => s + w.salary, 0)
  const feedCost = feed.reduce((s, r) => s + r.totalCost, 0)
  const otherCost = expenses.reduce((s, r) => s + r.amount, 0)
  const expBreakdown = [
    { name: 'Feed', value: feedCost },
    { name: 'Salaries', value: salaryCost },
    { name: 'Other', value: otherCost },
  ]

  return (
    <Shell>
      <PageHeader title="Analytics" subtitle={subtitle} />

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Production trend */}
        <div className="card">
          <div className="section-title">Egg production — last 7 days</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={prodData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="good" stackId="1" stroke="#1D9E75" fill="#E1F5EE" name="Good eggs" />
              <Area type="monotone" dataKey="cracked" stackId="1" stroke="#EF9F27" fill="#FEF3C7" name="Cracked" />
              <Area type="monotone" dataKey="spoilt" stackId="1" stroke="#E24B4A" fill="#FEE2E2" name="Spoilt" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Expenses */}
        <div className="card">
          <div className="section-title">Revenue vs expenses — last 7 days</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={financeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₦' + Math.round(v / 1000) + 'k'} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" fill="#1D9E75" name="Revenue" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" fill="#E24B4A" name="Expenses" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit trend */}
        <div className="card">
          <div className="section-title">Profit / loss trend — last 7 days</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={financeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₦' + Math.round(v / 1000) + 'k'} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Line type="monotone" dataKey="profit" stroke="#0F6E56" strokeWidth={2} dot={{ r: 3 }} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mortality trend */}
        <div className="card">
          <div className="section-title">Mortality trend — last 7 days</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mortalityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="deaths" fill="#E24B4A" name="Deaths" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense breakdown */}
      <div className="card">
        <div className="section-title">Expense breakdown (all time)</div>
        <div className="grid grid-cols-3 gap-4">
          {expBreakdown.map(e => (
            <div key={e.name} className="kpi-card">
              <div className="kpi-label">{e.name}</div>
              <div className="kpi-value text-red-500">{fmt(e.value)}</div>
              <div className="kpi-sub">
                {e.value + otherCost + feedCost + salaryCost > 0
                  ? Math.round((e.value / (feedCost + salaryCost + otherCost)) * 100) + '% of total'
                  : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
