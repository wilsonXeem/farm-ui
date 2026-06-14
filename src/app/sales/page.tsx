'use client'
import { useState, useEffect } from 'react'
import Shell from '@/components/layout/Shell'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DeleteBtn from '@/components/ui/DeleteBtn'
import { useFarmStore, useTotals } from '@/store/farmStore'
import { useRole } from '@/hooks/useRole'
import { fmt, fmtN, today } from '@/lib/utils'
import { Plus, Printer, Loader2 } from 'lucide-react'
import type { SaleRecord, OtherSaleRecord, EggSize } from '@/types'
import { farmService } from '@/services/farmService'

const EGG_SIZES: EggSize[] = ['Jumbo', 'Medium', 'Table']
const OTHER_ITEMS = ['Cracks', 'Sacks', 'Manure', 'Old Cages', 'Hens', 'Other']
const CRACK_UNITS = ['Crates', 'Pieces']
const STATUSES = ['Paid', 'Unpaid', 'Part payment']

function getLogoBase64(): string {
  return `${window.location.origin}/logo.png`
}

function buildInvoiceStyles(statusColor: string) {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a18; }
    .page { max-width: 600px; margin: 0 auto; padding: 40px; }
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 3px solid #0F6E56; margin-bottom: 28px; }
    .logo { height: 60px; object-fit: contain; }
    .company-info { text-align: right; }
    .company-info h1 { font-size: 20px; font-weight: 700; color: #0F6E56; }
    .company-info p { font-size: 12px; color: #666; margin-top: 2px; }
    .receipt-meta { display: flex; justify-content: space-between; margin-bottom: 28px; }
    .meta-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
    .meta-block p { font-size: 14px; font-weight: 500; }
    .meta-block .invoice-no { font-size: 18px; font-weight: 700; color: #0F6E56; }
    .divider { border: none; border-top: 1px solid #e5e5e5; margin: 20px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { background: #f7f6f2; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
    .items-table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
    .items-table tr:last-child td { border-bottom: none; }
    .totals { margin-left: auto; width: 280px; margin-bottom: 16px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
    .totals-row.grand { font-size: 18px; font-weight: 700; color: #0F6E56; border-bottom: none; padding-top: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${statusColor}20; color: ${statusColor}; }
    .payment-info { border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px 16px; margin-top: 20px; }
    .payment-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 10px; }
    .payment-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .payment-row span:first-child { color: #666; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 11px; color: #999; }
    .thank-you { font-size: 14px; font-weight: 600; color: #0F6E56; }
    @media print { .page { padding: 20px; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  `
}

function buildBankHtml(settings: any) {
  if (!settings?.bankName) return ''
  return `
    <div class="payment-info">
      <div class="payment-title">Payment Information</div>
      <div class="payment-row"><span>Bank</span><span>${settings.bankName}</span></div>
      <div class="payment-row"><span>Account Number</span><span><strong>${settings.bankAccount}</strong></span></div>
      <div class="payment-row"><span>Account Name</span><span>${settings.bankAccountName}</span></div>
    </div>`
}

function printInvoice(r: SaleRecord, settings: any) {
  const w = window.open('', '_blank')
  if (!w) return
  const invoiceNo = r.id.slice(0, 8).toUpperCase()
  const saleDate = new Date(r.date).toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' })
  const statusColor = r.status === 'Paid' ? '#0F6E56' : r.status === 'Unpaid' ? '#dc2626' : '#d97706'

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt — ${invoiceNo}</title>
  <style>${buildInvoiceStyles(statusColor)}</style>
</head>
<body>
<div class="page">
  <div class="header">
    <img src="${getLogoBase64()}" class="logo" alt="${settings?.name ?? 'Farm'}" />
    <div class="company-info">
      <h1>${settings?.name ?? 'Okesreal Farm'}</h1>
      <p>Poultry Farm Management System</p>
      ${settings?.location ? `<p>${settings.location}</p>` : ''}
    </div>
  </div>

  <div class="receipt-meta">
    <div class="meta-block"><h3>Invoice No</h3><p class="invoice-no">#${invoiceNo}</p></div>
    <div class="meta-block"><h3>Sale Date</h3><p>${saleDate}</p></div>
    <div class="meta-block"><h3>Payment Status</h3><span class="status-badge">${r.status}</span></div>
  </div>

  <div class="meta-block" style="margin-bottom:24px">
    <h3>Bill To</h3>
    <p style="font-size:16px;font-weight:600;margin-top:4px">${r.customer || 'Walk-in Customer'}</p>
  </div>

  <hr class="divider" />

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Size</th>
        <th style="text-align:center">Crates</th>
        <th style="text-align:right">Price/Crate</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Fresh Eggs</strong></td>
        <td>${r.size}</td>
        <td style="text-align:center">${r.crates}</td>
        <td style="text-align:right">₦${r.pricePerCrate.toLocaleString()}</td>
        <td style="text-align:right"><strong>₦${r.total.toLocaleString()}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>₦${r.total.toLocaleString()}</span></div>
    <div class="totals-row grand"><span>Total</span><span>₦${r.total.toLocaleString()}</span></div>
  </div>

  ${buildBankHtml(settings)}

  <div class="footer">
    <p class="thank-you">Thank you for your business!</p>
    <p>${settings?.name ?? 'Okesreal Farm'}</p>
  </div>
</div>
<script>window.onload = function(){ window.print(); }<\/script>
</body></html>`)
  w.document.close()
}

function printOtherInvoice(r: OtherSaleRecord, settings: any) {
  const w = window.open('', '_blank')
  if (!w) return
  const invoiceNo = r.id.slice(0, 8).toUpperCase()
  const saleDate = new Date(r.date).toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' })
  const statusColor = r.status === 'Paid' ? '#0F6E56' : r.status === 'Unpaid' ? '#dc2626' : '#d97706'

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt — ${invoiceNo}</title>
  <style>${buildInvoiceStyles(statusColor)}</style>
</head>
<body>
<div class="page">
  <div class="header">
    <img src="${getLogoBase64()}" class="logo" alt="${settings?.name ?? 'Farm'}" />
    <div class="company-info">
      <h1>${settings?.name ?? 'Okesreal Farm'}</h1>
      <p>Poultry Farm Management System</p>
      ${settings?.location ? `<p>${settings.location}</p>` : ''}
    </div>
  </div>

  <div class="receipt-meta">
    <div class="meta-block"><h3>Invoice No</h3><p class="invoice-no">#${invoiceNo}</p></div>
    <div class="meta-block"><h3>Sale Date</h3><p>${saleDate}</p></div>
    <div class="meta-block"><h3>Payment Status</h3><span class="status-badge">${r.status}</span></div>
  </div>

  <div class="meta-block" style="margin-bottom:24px">
    <h3>Bill To</h3>
    <p style="font-size:16px;font-weight:600;margin-top:4px">${r.customer || 'Walk-in Customer'}</p>
  </div>

  <hr class="divider" />

  <table class="items-table">
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Quantity</th>
        <th>Unit</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${r.item}</strong></td>
        <td style="text-align:center">${r.qty}</td>
        <td>${r.unit}</td>
        <td style="text-align:right">₦${r.unitPrice.toLocaleString()}</td>
        <td style="text-align:right"><strong>₦${r.total.toLocaleString()}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row grand"><span>Total</span><span>₦${r.total.toLocaleString()}</span></div>
  </div>

  ${buildBankHtml(settings)}

  <div class="footer">
    <p class="thank-you">Thank you for your business!</p>
    <p>${settings?.name ?? 'Okesreal Farm'}</p>
  </div>
</div>
<script>window.onload = function(){ window.print(); }<\/script>
</body></html>`)
  w.document.close()
}

const initEggForm = { date: today(), customer: '', size: 'Table' as EggSize, crates: '', loose: '0', pricePerCrate: '', total: '', status: 'Paid' as const }
const initOtherForm = { date: today(), item: 'Cracks', customItem: '', qty: '', unit: 'Crates', unitPrice: '', total: '', customer: '', penId: '', status: 'Paid' as const }

function StatusSelect({ saleId, current }: { saleId: string; current: string }) {
  const { updateSaleStatus } = useFarmStore() as any
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSaving(true)
    try { await updateSaleStatus(saleId, e.target.value) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex items-center gap-1">
      {saving && <Loader2 size={11} className="animate-spin text-stone-400" />}
      <select
        className="input text-xs py-0.5 px-1.5 w-32"
        value={current}
        onChange={handleChange}
        disabled={saving}
      >
        {STATUSES.map(s => <option key={s}>{s}</option>)}
      </select>
    </div>
  )
}

export default function SalesPage() {
  const { sales, otherSales, addSale, deleteSale, addOtherSale, deleteOtherSale, pens } = useFarmStore()
  const { eggRevenue, otherRevenue, totalRevenue, unpaidDebt, eggsOnHand, cratesOnHand, looseOnHand, goodEggs, eggsSold } = useTotals()
  const farmSettings = (useFarmStore() as any).farmSettings
  const { can, isAdmin } = useRole()
  const [tab, setTab] = useState<'eggs' | 'other' | 'daily'>('eggs')
  const [eggForm, setEggForm] = useState(initEggForm)
  const [otherForm, setOtherForm] = useState(initOtherForm)
  const [savingEgg, setSavingEgg] = useState(false)
  const [savingOther, setSavingOther] = useState(false)
  const setE = (k: string, v: string) => setEggForm(f => ({ ...f, [k]: v }))
  const setO = (k: string, v: string) => setOtherForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const totalPieces = (Number(eggForm.crates) * 30) + Number(eggForm.loose)
    const p = Number(eggForm.pricePerCrate)
    if (totalPieces && p) {
      const exactCrates = totalPieces / 30
      setEggForm(f => ({ ...f, total: String(Math.round(exactCrates * p)) }))
    }
  }, [eggForm.crates, eggForm.loose, eggForm.pricePerCrate])

  useEffect(() => {
    if (!farmSettings) return
    const priceMap: Record<string, number> = {
      'Jumbo': farmSettings.priceJumbo,
      'Medium': farmSettings.priceMedium,
      'Table': farmSettings.priceTable,
    }
    const price = priceMap[eggForm.size]
    if (price > 0) setEggForm(f => ({ ...f, pricePerCrate: String(price) }))
  }, [eggForm.size, farmSettings])

  useEffect(() => {
    const q = Number(otherForm.qty), p = Number(otherForm.unitPrice)
    if (q && p) setOtherForm(f => ({ ...f, total: String(q * p) }))
  }, [otherForm.qty, otherForm.unitPrice])

  function handleAddEgg() {
    if (!eggForm.date || (!eggForm.crates && !eggForm.loose) || !eggForm.pricePerCrate) return
    const totalPieces = (Number(eggForm.crates) * 30) + Number(eggForm.loose)
    const exactCrates = totalPieces / 30
    setSavingEgg(true)
    Promise.resolve(
      addSale({ date: eggForm.date, customer: eggForm.customer, size: eggForm.size, crates: exactCrates, pricePerCrate: Number(eggForm.pricePerCrate), total: Number(eggForm.total) || Math.round(exactCrates * Number(eggForm.pricePerCrate)), status: eggForm.status as any })
    ).then(() => setEggForm(initEggForm)).finally(() => setSavingEgg(false))
  }

  function handleAddOther() {
    if (!otherForm.date || !otherForm.qty || !otherForm.unitPrice) return
    setSavingOther(true)
    const item = otherForm.item === 'Other' ? otherForm.customItem || 'Other' : otherForm.item
    Promise.resolve(
      addOtherSale({ date: otherForm.date, item, qty: Number(otherForm.qty), unit: otherForm.unit, unitPrice: Number(otherForm.unitPrice), total: Number(otherForm.total) || Number(otherForm.qty) * Number(otherForm.unitPrice), customer: otherForm.customer, penId: otherForm.penId || undefined, status: otherForm.status as any })
    ).then(() => setOtherForm(initOtherForm)).finally(() => setSavingOther(false))
  }

  const sortedEggs = [...sales].sort((a, b) => b.date.localeCompare(a.date))
  const sortedOther = [...(otherSales ?? [])].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Shell>
      <PageHeader title="Sales" subtitle="Egg sales and other farm sales" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="kpi-card"><div className="kpi-label">Total revenue</div><div className="kpi-value text-brand-600">{fmt(totalRevenue)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Unpaid debts</div><div className="kpi-value text-red-500">{fmt(unpaidDebt)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Eggs on hand</div><div className="kpi-value text-brand-600">{fmtN(eggsOnHand)}<span className="text-xs text-stone-400 font-normal ml-1">({cratesOnHand} crates + {looseOnHand})</span></div></div>
        <div className="kpi-card"><div className="kpi-label">Eggs sold</div><div className="kpi-value">{fmtN(eggsSold)}<span className="text-xs text-stone-400 font-normal ml-1">of {fmtN(goodEggs)}</span></div></div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className={`btn ${tab === 'eggs' ? 'btn-primary' : ''}`} onClick={() => setTab('eggs')}>🥚 Egg Sales</button>
        <button className={`btn ${tab === 'other' ? 'btn-primary' : ''}`} onClick={() => setTab('other')}>📦 Other Sales</button>
        <button className={`btn ${tab === 'daily' ? 'btn-primary' : ''}`} onClick={() => setTab('daily')}>📅 Daily Report</button>
      </div>

      {/* EGG SALES TAB */}
      {tab === 'eggs' && (
        <>
          {can.writeSales && (
            <div className="card mb-4">
              <div className="section-title">Record egg sale</div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="input" value={eggForm.date} onChange={e => setE('date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Customer</label><input className="input" placeholder="e.g. Mama Nkechi" value={eggForm.customer} onChange={e => setE('customer', e.target.value)} /></div>
              </div>
              <div className="form-row-3">
                <div className="form-group"><label className="form-label">Egg size</label>
                  <select className="input" value={eggForm.size} onChange={e => setE('size', e.target.value)}>
                    {EGG_SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Crates sold</label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input type="number" className="input" placeholder="Crates" min={0} value={eggForm.crates} onChange={e => setE('crates', e.target.value)} />
                      <span className="text-xs text-stone-400 mt-0.5 block text-center">crates</span>
                    </div>
                    <span className="text-stone-400 font-medium pb-4">+</span>
                    <div className="flex-1">
                      <input type="number" className="input" placeholder="Loose" min={0} max={29} value={eggForm.loose} onChange={e => setE('loose', e.target.value)} />
                      <span className="text-xs text-stone-400 mt-0.5 block text-center">pieces</span>
                    </div>
                  </div>
                  {(eggForm.crates || eggForm.loose) && (
                    <span className="text-xs text-stone-400 mt-0.5 block">
                      = {fmtN((Number(eggForm.crates) * 30) + Number(eggForm.loose))} pieces
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Price per crate (₦)</label>
                  <input type="number" className="input" value={eggForm.pricePerCrate} onChange={e => setE('pricePerCrate', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Total (₦)</label><input type="number" className="input" placeholder="Auto" value={eggForm.total} onChange={e => setE('total', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Payment status</label>
                  <select className="input" value={eggForm.status} onChange={e => setE('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleAddEgg} disabled={savingEgg}>
                {savingEgg ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Record sale
              </button>
            </div>
          )}
          <div className="card">
            <div className="section-title">Egg sales log</div>
            {sortedEggs.length === 0 ? <EmptyState /> : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Date</th><th>Customer</th><th>Size</th><th>Crates</th><th>Price/crate</th><th>Total</th><th>Status</th><th></th><th></th></tr></thead>
                  <tbody>
                    {sortedEggs.map(r => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td className="font-medium">{r.customer || '—'}</td>
                        <td><span className="badge badge-blue">{r.size}</span></td>
                        <td>{fmtN(r.crates)}</td>
                        <td>{fmt(r.pricePerCrate)}</td>
                        <td className="font-medium text-brand-600">{fmt(r.total)}</td>
                        <td>
                          {isAdmin
                            ? <StatusSelect saleId={r.id} current={r.status} />
                            : <span className={`badge ${r.status === 'Paid' ? 'badge-green' : r.status === 'Unpaid' ? 'badge-red' : 'badge-amber'}`}>{r.status}</span>
                          }
                        </td>
                        <td><button className="btn text-xs py-1 px-2" onClick={() => printInvoice(r, farmSettings)}><Printer size={12} /> Invoice</button></td>
                        <td>{can.deleteSales && <DeleteBtn onDelete={() => deleteSale(r.id)} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* OTHER SALES TAB */}
      {tab === 'other' && (
        <>
          {can.writeSales && (
            <div className="card mb-4">
              <div className="section-title">Record other sale</div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="input" value={otherForm.date} onChange={e => setO('date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Item</label>
                  <select className="input" value={otherForm.item} onChange={e => setO('item', e.target.value)}>
                    {OTHER_ITEMS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              {otherForm.item === 'Other' && (
                <div className="form-group mb-3"><label className="form-label">Item name</label><input className="input" placeholder="Enter item name" value={otherForm.customItem} onChange={e => setO('customItem', e.target.value)} /></div>
              )}
              {otherForm.item === 'Hens' && (
                <div className="form-group mb-3"><label className="form-label">Pen (required for hens)</label>
                  <select className="input" value={otherForm.penId} onChange={e => setO('penId', e.target.value)}>
                    <option value="">— Select pen —</option>
                    {pens.map(p => <option key={p.id} value={p.id}>{p.name} ({p.totalBirds} birds)</option>)}
                  </select>
                </div>
              )}
              <div className="form-row-3">
                <div className="form-group"><label className="form-label">Quantity</label><input type="number" className="input" value={otherForm.qty} onChange={e => setO('qty', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Unit</label>
                  {otherForm.item === 'Cracks' ? (
                    <select className="input" value={otherForm.unit} onChange={e => setO('unit', e.target.value)}>
                      {CRACK_UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  ) : (
                    <input className="input" placeholder="e.g. bags, pcs" value={otherForm.unit} onChange={e => setO('unit', e.target.value)} />
                  )}
                </div>
                <div className="form-group"><label className="form-label">Unit price (₦)</label><input type="number" className="input" value={otherForm.unitPrice} onChange={e => setO('unitPrice', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Total (₦)</label><input type="number" className="input" placeholder="Auto" value={otherForm.total} onChange={e => setO('total', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Customer (optional)</label><input className="input" value={otherForm.customer} onChange={e => setO('customer', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Payment status</label>
                  <select className="input" value={otherForm.status} onChange={e => setO('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="btn btn-primary w-full" onClick={handleAddOther} disabled={savingOther}>
                    {savingOther ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Record sale
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="card">
            <div className="section-title">Other sales log</div>
            {sortedOther.length === 0 ? <EmptyState message="No other sales recorded yet." /> : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Date</th><th>Item</th><th>Qty</th><th>Unit</th><th>Unit price</th><th>Total</th><th>Customer</th><th>Status</th><th></th><th></th></tr></thead>
                  <tbody>
                    {sortedOther.map(r => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td><span className="badge badge-amber">{r.item}</span></td>
                        <td>{fmtN(r.qty)}</td>
                        <td className="text-stone-400">{r.unit}</td>
                        <td>{fmt(r.unitPrice)}</td>
                        <td className="font-medium text-brand-600">{fmt(r.total)}</td>
                        <td className="text-stone-400">{r.customer || '—'}</td>
                        <td><span className={`badge ${r.status === 'Paid' ? 'badge-green' : r.status === 'Unpaid' ? 'badge-red' : 'badge-amber'}`}>{r.status}</span></td>
                        <td><button className="btn text-xs py-1 px-2" onClick={() => printOtherInvoice(r, farmSettings)}><Printer size={12} /> Invoice</button></td>
                        <td>{can.deleteSales && <DeleteBtn onDelete={() => deleteOtherSale(r.id)} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      {/* DAILY REPORT TAB */}
      {tab === 'daily' && (() => {
        const todayStr = today()
        const todaySales = sales.filter(r => r.date === todayStr)
        const todayOther = (otherSales ?? []).filter(r => r.date === todayStr)
        const todayEggsSold = todaySales.reduce((s, r) => s + (r.crates * 30), 0)
        const todayCrates = Math.floor(todayEggsSold / 30)
        const todayLoose = todayEggsSold % 30
        const todayRevenue = todaySales.reduce((s, r) => s + r.total, 0)
        const todayOtherRevenue = todayOther.reduce((s, r) => s + r.total, 0)
        const todayUnpaid = [...todaySales, ...todayOther].filter(r => r.status === 'Unpaid').reduce((s, r) => s + r.total, 0)
        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="kpi-card"><div className="kpi-label">Eggs sold today</div><div className="kpi-value">{fmtN(todayEggsSold)}</div></div>
              <div className="kpi-card"><div className="kpi-label">Crates today</div><div className="kpi-value text-brand-600">{todayCrates}<span className="text-xs text-stone-400 font-normal"> + {todayLoose}</span></div></div>
              <div className="kpi-card"><div className="kpi-label">Revenue today</div><div className="kpi-value text-brand-600">{fmt(todayRevenue + todayOtherRevenue)}</div></div>
              <div className="kpi-card"><div className="kpi-label">Unpaid today</div><div className="kpi-value text-red-500">{fmt(todayUnpaid)}</div></div>
            </div>
            <div className="card mb-4">
              <div className="section-title">Today's egg sales — {todayStr}</div>
              {todaySales.length === 0 ? <EmptyState message="No egg sales recorded today." /> : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Customer</th><th>Size</th><th>Crates</th><th>Pieces</th><th>Price/crate</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                      {todaySales.map(r => (
                        <tr key={r.id}>
                          <td className="font-medium">{r.customer || '—'}</td>
                          <td><span className="badge badge-blue">{r.size}</span></td>
                          <td>{Math.floor(r.crates)}{r.crates % 1 > 0 ? <span className="text-stone-400 text-xs"> + {Math.round((r.crates % 1) * 30)}</span> : ''}</td>
                          <td className="text-stone-400">{fmtN(r.crates * 30)}</td>
                          <td>{fmt(r.pricePerCrate)}</td>
                          <td className="font-medium text-brand-600">{fmt(r.total)}</td>
                          <td><span className={`badge ${r.status === 'Paid' ? 'badge-green' : r.status === 'Unpaid' ? 'badge-red' : 'badge-amber'}`}>{r.status}</span></td>
                        </tr>
                      ))}
                      <tr className="bg-stone-50 font-medium">
                        <td colSpan={2}>Total</td>
                        <td>{todayCrates} + {todayLoose}</td>
                        <td>{fmtN(todayEggsSold)}</td>
                        <td>—</td>
                        <td className="text-brand-600">{fmt(todayRevenue)}</td>
                        <td>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {todayOther.length > 0 && (
              <div className="card">
                <div className="section-title">Today's other sales</div>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th><th>Customer</th><th>Status</th></tr></thead>
                    <tbody>
                      {todayOther.map(r => (
                        <tr key={r.id}>
                          <td><span className="badge badge-amber">{r.item}</span></td>
                          <td>{fmtN(r.qty)}</td>
                          <td className="text-stone-400">{r.unit}</td>
                          <td className="font-medium text-brand-600">{fmt(r.total)}</td>
                          <td className="text-stone-400">{r.customer || '—'}</td>
                          <td><span className={`badge ${r.status === 'Paid' ? 'badge-green' : r.status === 'Unpaid' ? 'badge-red' : 'badge-amber'}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )
      })()}
    </Shell>
  )
}
