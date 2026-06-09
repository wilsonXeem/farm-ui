'use client'
import { useState } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import { useFarmStore, useTotals } from '@/store/farmStore'
import { fmt, fmtN } from '@/lib/utils'
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

export default function PricingPage() {
  const { expenses, sales, payroll, workers } = useFarmStore()
  const t = useTotals()
  const [margin, setMargin] = useState(25)
  const [eggCount, setEggCount] = useState(1000)

  const salaryCost = payroll.reduce((s, p) => s + p.amount, 0)
  const monthlySalaryBill = workers.reduce((s, w) => s + w.salary, 0)
  const otherCost = expenses.reduce((s, r) => s + r.amount, 0)

  const suggestedPerEgg = t.costPerEgg * (1 + margin / 100)
  const suggestedPerCrate = suggestedPerEgg * 30
  const expectedRevenue = suggestedPerEgg * eggCount
  const expectedProfit = expectedRevenue - (t.costPerEgg * eggCount)

  const totalCratesSold = sales.reduce((s, r) => s + r.crates, 0)
  const totalEggsSold = totalCratesSold * 30
  const avgActualPerEgg = totalEggsSold > 0 ? t.totalRevenue / totalEggsSold : 0
  const isSellingAtLoss = avgActualPerEgg > 0 && avgActualPerEgg < t.costPerEgg

  return (
    <Shell>
      <PageHeader title="Pricing engine" subtitle="Smart cost accounting and profit calculator" />

      {isSellingAtLoss && (
        <div className="alert alert-danger">
          <AlertTriangle size={15} />
          Warning: Your average selling price ({fmt(avgActualPerEgg)}/egg) is below cost price ({fmt(t.costPerEgg)}/egg). You are selling at a loss!
        </div>
      )}

      {!isSellingAtLoss && avgActualPerEgg > 0 && (
        <div className="alert alert-success">
          <CheckCircle size={15} />
          Current pricing is above cost ({fmt(avgActualPerEgg)}/egg vs {fmt(t.costPerEgg)}/egg cost). Keep monitoring as expenses change.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Cost breakdown */}
        <div className="card">
          <div className="section-title">Cost breakdown</div>
          <div className="space-y-0">
            <div className="pricing-row"><span className="text-stone-500">Salaries paid</span><span className="text-red-500">{fmt(salaryCost)}</span></div>
            <div className="pricing-row"><span className="text-stone-500">Monthly salary bill</span><span className="text-stone-400 text-xs">{fmt(monthlySalaryBill)}/mo</span></div>
            <div className="pricing-row"><span className="text-stone-500">Other expenses</span><span className="text-red-500">{fmt(otherCost)}</span></div>
            <div className="pricing-row"><span className="font-medium">Total expenses</span><span className="font-medium text-red-500">{fmt(t.totalExpenses)}</span></div>
            <div className="h-3" />
            <div className="pricing-row"><span className="text-stone-500">Good eggs produced</span><span>{fmtN(t.goodEggs)}</span></div>
            <div className="pricing-row"><span className="text-stone-500">Cost per egg</span><span className="font-medium">{fmt(t.costPerEgg)}</span></div>
            <div className="pricing-row" style={{ borderBottom: 'none' }}><span className="text-stone-500">Cost per crate (30 eggs)</span><span className="font-medium">{fmt(t.costPerCrate)}</span></div>
          </div>
        </div>

        {/* Pricing calculator */}
        <div className="card">
          <div className="section-title">Pricing calculator</div>
          <div className="mb-4">
            <label className="form-label">Desired profit margin: <strong className="text-brand-600">{margin}%</strong></label>
            <input type="range" min={5} max={60} step={1} value={margin} onChange={e => setMargin(Number(e.target.value))}
              className="w-full mt-1 accent-brand-600" />
            <div className="flex justify-between text-xs text-stone-400 mt-0.5"><span>5%</span><span>60%</span></div>
          </div>
          <div className="mb-4">
            <label className="form-label">Eggs to price</label>
            <input type="number" className="input" value={eggCount} onChange={e => setEggCount(Number(e.target.value))} />
          </div>
          <div className="bg-stone-50 rounded-lg p-4 space-y-0">
            <div className="pricing-row"><span className="text-stone-500">Cost per egg</span><span>{fmt(t.costPerEgg)}</span></div>
            <div className="pricing-row"><span className="text-stone-500">Suggested price / egg</span><span className="text-blue-600 font-medium">{fmt(suggestedPerEgg)}</span></div>
            <div className="pricing-row"><span className="text-stone-500">Suggested price / crate</span><span className="text-blue-600 font-medium">{fmt(suggestedPerCrate)}</span></div>
            <div className="pricing-row"><span className="text-stone-500">Revenue ({fmtN(eggCount)} eggs)</span><span className="text-brand-600">{fmt(expectedRevenue)}</span></div>
            <div className="pricing-row" style={{ borderBottom: 'none', fontWeight: 500, fontSize: 15 }}>
              <span>Expected profit</span><span className="text-brand-600">{fmt(expectedProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis table */}
      <div className="card">
        <div className="section-title">Loss detection analysis</div>
        {t.goodEggs === 0 ? (
          <div className="text-sm text-stone-400 py-4">Add production data to enable analysis.</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Metric</th><th>Value</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Total expenses</td><td>{fmt(t.totalExpenses)}</td><td><span className="badge badge-amber">Cost</span></td></tr>
              <tr><td>Total revenue</td><td>{fmt(t.totalRevenue)}</td><td><span className={`badge ${t.totalRevenue >= t.totalExpenses ? 'badge-green' : 'badge-red'}`}>{t.totalRevenue >= t.totalExpenses ? 'Profitable' : 'Loss'}</span></td></tr>
              <tr>
                <td>Net profit / loss</td>
                <td className={`font-medium ${t.profit >= 0 ? 'text-brand-600' : 'text-red-500'}`}>{t.profit < 0 ? '-' : ''}{fmt(Math.abs(t.profit))}</td>
                <td><span className={`badge ${t.profit >= 0 ? 'badge-green' : 'badge-red'}`}>{t.profit >= 0 ? 'Profit' : 'Loss'}</span></td>
              </tr>
              <tr><td>Break-even price / egg</td><td>{fmt(t.costPerEgg)}</td><td><span className="badge badge-blue">Min price</span></td></tr>
              <tr><td>Avg actual price / egg</td><td>{avgActualPerEgg > 0 ? fmt(avgActualPerEgg) : 'No sales yet'}</td>
                <td><span className={`badge ${avgActualPerEgg >= t.costPerEgg ? 'badge-green' : avgActualPerEgg > 0 ? 'badge-red' : 'badge-gray'}`}>{avgActualPerEgg >= t.costPerEgg ? 'Above cost' : avgActualPerEgg > 0 ? 'Below cost' : '—'}</span></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  )
}
