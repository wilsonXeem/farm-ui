'use client'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import KpiCard from '@/components/ui/KpiCard'
import { useFarmStore, useTotals } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { useStaffPens } from '@/hooks/useStaffPens'
import { useAuthStore } from '@/store/authStore'
import { fmt, fmtN, getLast7Days } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const PIE_COLORS = ['#0F6E56', '#378ADD', '#E24B4A', '#EF9F27', '#7F77DD', '#D85A30']
const dateStr = new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

// ── Staff dashboard ──────────────────────────────────────────────
function StaffDashboard() {
  const { user } = useAuthStore()
  const { myPens, myProduction, myMortality } = useStaffPens()
  const last7 = getLast7Days()
  const today = last7[last7.length - 1]

  const todayEggs = myProduction.filter(r => r.date === today).reduce((s, r) => s + r.goodEggs, 0)
  const totalGoodEggs = myProduction.reduce((s, r) => s + r.goodEggs, 0)
  const totalDeaths = myMortality.reduce((s, r) => s + r.count, 0)
  const totalBirds = myPens.reduce((s, p) => s + p.totalBirds, 0)
  const availableBirds = totalBirds - totalDeaths

  const prodChartData = last7.map(d => ({
    date: d.slice(5),
    eggs: myProduction.filter(r => r.date === d).reduce((s, r) => s + r.goodEggs, 0),
  }))

  return (
    <Shell>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={`${dateStr} — ${myPens.map(p => p.name).join(', ')}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Birds available" value={fmtN(availableBirds)} sub={`of ${fmtN(totalBirds)} total`} color="blue" />
        <KpiCard label="Total deaths" value={fmtN(totalDeaths)} color="red" />
        <KpiCard label="Good eggs (total)" value={fmtN(totalGoodEggs)} sub={`${Math.floor(totalGoodEggs / 30)} crates + ${totalGoodEggs % 30} loose`} color="green" />
        <KpiCard label="Eggs today" value={fmtN(todayEggs)} sub={todayEggs >= 30 ? `${Math.floor(todayEggs / 30)} crates` : undefined} />
      </div>

      {/* Per-pen breakdown — responsive grid */}
      <div className="card mb-4">
        <div className="section-title">Your pens</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {myPens.map(pen => {
            const deaths = myMortality.filter(r => r.penId === pen.id).reduce((s, r) => s + r.count, 0)
            const available = pen.totalBirds - deaths
            const eggs = myProduction.filter(r => r.penId === pen.id).reduce((s, r) => s + r.goodEggs, 0)
            return (
              <div key={pen.id} className="bg-stone-50 rounded-xl p-4">
                <div className="font-medium text-stone-800 mb-3">{pen.name}</div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-stone-400">Birds</span><span className="font-medium text-brand-600">{fmtN(available)}</span></div>
                  <div className="flex justify-between"><span className="text-stone-400">Deaths</span><span className="text-red-500">{fmtN(deaths)}</span></div>
                  <div className="flex justify-between"><span className="text-stone-400">Good eggs</span><span className="font-medium">{fmtN(eggs)}</span></div>
                  <div className="flex justify-between"><span className="text-stone-400">Crates</span><span className="font-medium">{Math.floor(eggs / 30)}</span></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Egg production — last 7 days</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={prodChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [fmtN(Number(v)), 'Good eggs']} />
            <Bar dataKey="eggs" fill="#1D9E75" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Shell>
  )
}

// ── Accountant dashboard ─────────────────────────────────────────
function AccountantDashboard() {
  const { expenses, sales, otherSales, payroll } = useFarmStore()
  const t = useTotals()
  const last7 = getLast7Days()
  const today = last7[last7.length - 1]
  const todayExp = expenses.filter(r => r.date === today).reduce((s, r) => s + r.amount, 0)
  const todaySales = [...sales, ...(otherSales ?? [])].filter(r => r.date === today).reduce((s, r) => s + r.total, 0)
  const suggestedPrice = t.costPerEgg * 1.25

  const revExpData = last7.map(d => ({
    date: d.slice(5),
    revenue: [...sales, ...(otherSales ?? [])].filter(r => r.date === d).reduce((s, r) => s + r.total, 0),
    expenses: expenses.filter(r => r.date === d).reduce((s, r) => s + r.amount, 0),
  }))

  const expPieData = [
    { name: 'Salaries paid', value: payroll.reduce((s, p) => s + p.amount, 0) },
    { name: 'Fuel', value: t.expByCategory('Fuel') },
    { name: 'Medication', value: t.expByCategory('Medication') },
    { name: 'Electricity', value: t.expByCategory('Electricity') },
    { name: 'Transport', value: t.expByCategory('Transport') },
    { name: 'Construction', value: t.expByCategory('Construction') },
    { name: 'Repairs', value: t.expByCategory('Repairs') },
    { name: 'Water', value: t.expByCategory('Water') },
    { name: 'Miscellaneous', value: t.expByCategory('Miscellaneous') },
  ].filter(d => d.value > 0)

  return (
    <Shell>
      <PageHeader title="Dashboard" subtitle={dateStr} />

      {t.profit < 0 && t.totalRevenue > 0 && (
        <div className="alert alert-danger mb-5">
          <AlertTriangle size={15} />
          Operating at a loss. Review pricing in the Pricing Engine.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total revenue" value={fmt(t.totalRevenue)} color="green" />
        <KpiCard label="Total expenses" value={fmt(t.totalExpenses)} color="red" />
        <KpiCard label="Net profit / loss" value={(t.profit < 0 ? '-' : '') + fmt(Math.abs(t.profit))} color={t.profit >= 0 ? 'green' : 'red'} />
        <KpiCard label="Unpaid debts" value={fmt(t.unpaidDebt)} color="red" />
        <KpiCard label="Cost per egg" value={fmt(t.costPerEgg)} sub={`Crate: ${fmt(t.costPerCrate)}`} />
        <KpiCard label="Suggested price/egg" value={fmt(suggestedPrice)} sub="25% margin" color="blue" />
        <KpiCard label="Revenue today" value={fmt(todaySales)} color="green" />
        <KpiCard label="Expenses today" value={fmt(todayExp)} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="section-title">Revenue vs expenses — last 7 days</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revExpData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₦' + Math.round(v / 1000) + 'k'} />
              <Tooltip formatter={(v, n) => [fmt(Number(v)), n === 'revenue' ? 'Revenue' : 'Expenses']} />
              <Line type="monotone" dataKey="revenue" stroke="#1D9E75" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#E24B4A" strokeWidth={2} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">Expense breakdown</div>
          {expPieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={expPieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                    {expPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {expPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}: {fmt(d.value)}
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="text-sm text-stone-400 py-4">No expense data yet.</div>}
        </div>
      </div>
    </Shell>
  )
}

// ── Admin / Farm Manager dashboard ───────────────────────────────
function AdminDashboard() {
  const { production, expenses, sales, otherSales, pens, mortality, payroll, inventory } = useFarmStore()
  const t = useTotals()
  const last7 = getLast7Days()
  const today = last7[last7.length - 1]

  const todayEggs = production.filter(r => r.date === today).reduce((s, r) => s + r.goodEggs, 0)
  const todayExp = expenses.filter(r => r.date === today).reduce((s, r) => s + r.amount, 0)
  const todaySales = [...sales, ...(otherSales ?? [])].filter(r => r.date === today).reduce((s, r) => s + r.total, 0)
  // Low stock from legacy inventory (stock page uses new system)
  const lowStock = inventory.filter(i => i.qty <= i.minQty)
  const suggestedPrice = t.costPerEgg * 1.25

  const prodChartData = last7.map(d => ({
    date: d.slice(5),
    eggs: production.filter(r => r.date === d).reduce((s, r) => s + r.goodEggs, 0),
  }))

  const revExpData = last7.map(d => ({
    date: d.slice(5),
    revenue: [...sales, ...(otherSales ?? [])].filter(r => r.date === d).reduce((s, r) => s + r.total, 0),
    expenses: expenses.filter(r => r.date === d).reduce((s, r) => s + r.amount, 0),
  }))

  const expPieData = [
    { name: 'Salaries paid', value: payroll.reduce((s, p) => s + p.amount, 0) },
    { name: 'Fuel', value: t.expByCategory('Fuel') },
    { name: 'Medication', value: t.expByCategory('Medication') },
    { name: 'Electricity', value: t.expByCategory('Electricity') },
    { name: 'Transport', value: t.expByCategory('Transport') },
    { name: 'Construction', value: t.expByCategory('Construction') },
    { name: 'Repairs', value: t.expByCategory('Repairs') },
    { name: 'Water', value: t.expByCategory('Water') },
    { name: 'Miscellaneous', value: t.expByCategory('Miscellaneous') },
  ].filter(d => d.value > 0)

  return (
    <Shell>
      <PageHeader title="Dashboard" subtitle={dateStr} />

      {lowStock.length > 0 && (
        <div className="alert alert-warn mb-4">
          <AlertTriangle size={15} />
          Low stock: {lowStock.map(i => i.item).join(', ')}
        </div>
      )}
      {t.profit < 0 && t.totalRevenue > 0 && (
        <div className="alert alert-danger mb-4">
          <AlertTriangle size={15} />
          Operating at a loss. Review pricing in the Pricing Engine.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Birds available" value={fmtN(t.availableBirds)} sub={`of ${fmtN(t.totalBirds)} total`} color="blue" />
        <KpiCard label="Good eggs (total)" value={fmtN(t.goodEggs)} sub={`${fmtN(Math.floor(t.goodEggs / 30))} crates + ${t.goodEggs % 30} loose`} />
        <KpiCard label="Eggs on hand" value={fmtN(t.eggsOnHand)} sub={`${t.cratesOnHand} crates + ${t.looseOnHand} loose`} color="green" />
        <KpiCard label="Eggs today" value={fmtN(todayEggs)} sub={todayEggs >= 30 ? `${Math.floor(todayEggs / 30)} crates` : undefined} />
        <KpiCard label="Cost per egg" value={fmt(t.costPerEgg)} sub={`Crate: ${fmt(t.costPerCrate)}`} />
        <KpiCard label="Total revenue" value={fmt(t.totalRevenue)} sub={`Today: ${fmt(todaySales)}`} color="green" />
        <KpiCard label="Total expenses" value={fmt(t.totalExpenses)} sub={`Today: ${fmt(todayExp)}`} color="red" />
        <KpiCard label="Net profit / loss" value={(t.profit < 0 ? '-' : '') + fmt(Math.abs(t.profit))} color={t.profit >= 0 ? 'green' : 'red'} />
        <KpiCard label="Suggested price" value={fmt(suggestedPrice) + '/egg'} sub={`${fmt(suggestedPrice * 30)}/crate`} color="blue" />
      </div>

      {/* Per-pen summary */}
      {pens.length > 0 && (
        <div className="card mb-4">
          <div className="section-title">Pen overview</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pens.map(pen => {
              const deaths = mortality.filter(r => r.penId === pen.id).reduce((s, r) => s + r.count, 0)
              const eggs = production.filter(r => r.penId === pen.id).reduce((s, r) => s + r.goodEggs, 0)
              const available = pen.totalBirds - deaths
              return (
                <div key={pen.id} className="bg-stone-50 rounded-lg p-3 text-center">
                  <div className="text-xs font-medium text-stone-700 mb-2">{pen.name}</div>
                  <div className="text-base font-medium text-brand-600">{fmtN(available)}</div>
                  <div className="text-[10px] text-stone-400">of {fmtN(pen.totalBirds)} birds</div>
                  <div className="text-xs text-stone-500 mt-1">{fmtN(eggs)} eggs</div>
                  <div className="text-[10px] text-stone-400">{Math.floor(eggs / 30)} crates</div>
                  {pen.worker && <div className="text-[10px] text-stone-400 mt-0.5 truncate">{pen.worker.name}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="section-title">Production — last 7 days</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={prodChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [fmtN(Number(v)), 'Good eggs']} />
              <Bar dataKey="eggs" fill="#1D9E75" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">Revenue vs expenses — last 7 days</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revExpData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₦' + Math.round(v / 1000) + 'k'} />
              <Tooltip formatter={(v, n) => [fmt(Number(v)), n === 'revenue' ? 'Revenue' : 'Expenses']} />
              <Line type="monotone" dataKey="revenue" stroke="#1D9E75" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#E24B4A" strokeWidth={2} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Expense breakdown</div>
        {expPieData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={expPieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                  {expPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {expPieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-stone-500">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}: {fmt(d.value)}
                </div>
              ))}
            </div>
          </div>
        ) : <div className="text-sm text-stone-400 py-4">No expense data yet.</div>}
      </div>
    </Shell>
  )
}

// ── Sales dashboard ───────────────────────────────────────────
function SalesDashboard() {
  const { expenses, sales, otherSales, payroll } = useFarmStore()
  const t = useTotals()
  const last7 = getLast7Days()
  const today = last7[last7.length - 1]

  const todaySales = [...sales, ...(otherSales ?? [])].filter(r => r.date === today).reduce((s, r) => s + r.total, 0)
  const todayExp = expenses.filter(r => r.date === today).reduce((s, r) => s + r.amount, 0)

  const revExpData = last7.map(d => ({
    date: d.slice(5),
    revenue: [...sales, ...(otherSales ?? [])].filter(r => r.date === d).reduce((s, r) => s + r.total, 0),
    expenses: expenses.filter(r => r.date === d).reduce((s, r) => s + r.amount, 0),
  }))

  return (
    <Shell>
      <PageHeader title="Dashboard" subtitle={dateStr} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total revenue" value={fmt(t.totalRevenue)} color="green" />
        <KpiCard label="Total expenses" value={fmt(t.totalExpenses)} color="red" />
        <KpiCard label="Unpaid debts" value={fmt(t.unpaidDebt)} color="red" />
        <KpiCard label="Net profit / loss" value={(t.profit < 0 ? '-' : '') + fmt(Math.abs(t.profit))} color={t.profit >= 0 ? 'green' : 'red'} />
        <KpiCard label="Revenue today" value={fmt(todaySales)} color="green" />
        <KpiCard label="Expenses today" value={fmt(todayExp)} color="red" />
        <KpiCard label="Egg sales" value={String(sales.length)} />
        <KpiCard label="Paid sales" value={String([...sales, ...(otherSales ?? [])].filter(s => s.status === 'Paid').length)} color="green" />
      </div>

      <div className="card">
        <div className="section-title">Revenue vs expenses — last 7 days</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={revExpData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₦' + Math.round(v / 1000) + 'k'} />
            <Tooltip formatter={(v, n) => [fmt(Number(v)), n === 'revenue' ? 'Revenue' : 'Expenses']} />
            <Line type="monotone" dataKey="revenue" stroke="#1D9E75" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" stroke="#E24B4A" strokeWidth={2} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Shell>
  )
}

// ── Root dashboard — picks the right view by role ─────────────────
export default function DashboardPage() {
  const { role } = useRole()

  if (role === 'Staff') return <StaffDashboard />
  if (role === 'Accountant') return <AccountantDashboard />
  if (role === 'Sales') return <SalesDashboard />
  return <AdminDashboard />
}
