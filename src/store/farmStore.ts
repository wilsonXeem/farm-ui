'use client'
import { create } from 'zustand'
import { farmService, FARM_ID, FarmSettings } from '@/services/farmService'
import type {
  FarmStore, ProductionRecord, MortalityRecord, InventoryItem,
  FeedPurchase, ExpenseRecord, SaleRecord, OtherSaleRecord, Worker, PayrollRecord, Pen,
} from '@/types'

interface ExtendedFarmStore extends FarmStore {
  loaded: boolean
  farmSettings: FarmSettings
  otherSales: OtherSaleRecord[]
  loadAll: () => Promise<void>
  refresh: () => Promise<void>
  updateSaleStatus: (id: string, status: string) => Promise<void>
  addOtherSale: (r: Omit<OtherSaleRecord, 'id'>) => void
  deleteOtherSale: (id: string) => void
  updateWorker: (id: string, r: Partial<Omit<Worker, 'id'>>) => void
}

export const useFarmStore = create<ExtendedFarmStore>((set, get) => ({
  totalBirds: 500,
  loaded: false,
  farmSettings: { id: FARM_ID, name: 'Okesreal Farm', totalBirds: 500, priceJumbo: 0, priceMedium: 0, priceTable: 0 } as any,
  pens: [],
  production: [],
  mortality: [],
  inventory: [],
  feed: [],
  expenses: [],
  sales: [],
  otherSales: [],
  workers: [],
  payroll: [],

  loadAll: async () => {
    if (get().loaded) return
    const fetchAll = async () => {
      const [farmSettings, pens, production, mortality, inventory, feed, expenses, sales, otherSales, workers, payroll] =
        await Promise.all([
          farmService.getFarmSettings(),
          farmService.getPens(),
          farmService.getProduction(),
          farmService.getMortality(),
          farmService.getInventory(),
          farmService.getFeed(),
          farmService.getExpenses(),
          farmService.getSales(),
          farmService.getOtherSales(),
          farmService.getWorkers(),
          farmService.getPayroll(),
        ])
      set({ farmSettings, pens, production, mortality, inventory, feed, expenses, sales, otherSales, workers, payroll, loaded: true })
    }
    try {
      await fetchAll()
    } catch (e) {
      console.warn('First load failed, retrying in 4s...', e)
      setTimeout(async () => {
        try { await fetchAll() } catch (e2) { console.error('Retry failed:', e2) }
      }, 4000)
    }
  },

  refresh: async () => {
    try {
      const [farmSettings, pens, production, mortality, inventory, feed, expenses, sales, otherSales, workers, payroll] =
        await Promise.all([
          farmService.getFarmSettings(),
          farmService.getPens(),
          farmService.getProduction(),
          farmService.getMortality(),
          farmService.getInventory(),
          farmService.getFeed(),
          farmService.getExpenses(),
          farmService.getSales(),
          farmService.getOtherSales(),
          farmService.getWorkers(),
          farmService.getPayroll(),
        ])
      set({ farmSettings, pens, production, mortality, inventory, feed, expenses, sales, otherSales, workers, payroll })
    } catch (e) { console.error('Refresh failed:', e) }
  },

  addProduction: async (r) => {
    const rec = await farmService.addProduction(r)
    set(s => ({ production: [rec, ...s.production] }))
    get().refresh()
  },
  deleteProduction: async (id) => {
    await farmService.deleteProduction(id)
    set(s => ({ production: s.production.filter(x => x.id !== id) }))
    get().refresh()
  },

  addMortality: async (r) => {
    const rec = await farmService.addMortality(r)
    set(s => ({ mortality: [rec, ...s.mortality] }))
    get().refresh()
  },
  deleteMortality: async (id) => {
    await farmService.deleteMortality(id)
    set(s => ({ mortality: s.mortality.filter(x => x.id !== id) }))
    get().refresh()
  },

  addInventory: async (r) => {
    const rec = await farmService.addInventory(r)
    set(s => ({ inventory: [rec, ...s.inventory] }))
  },
  deleteInventory: async (id) => {
    await farmService.deleteInventory(id)
    set(s => ({ inventory: s.inventory.filter(x => x.id !== id) }))
  },

  addFeed: async (r) => {
    const rec = await farmService.addFeed(r)
    set(s => ({ feed: [rec, ...s.feed] }))
  },
  deleteFeed: async (id) => {
    await farmService.deleteFeed(id)
    set(s => ({ feed: s.feed.filter(x => x.id !== id) }))
  },

  addExpense: async (r) => {
    const rec = await farmService.addExpense(r)
    set(s => ({ expenses: [rec, ...s.expenses] }))
    get().refresh()
  },
  deleteExpense: async (id) => {
    await farmService.deleteExpense(id)
    set(s => ({ expenses: s.expenses.filter(x => x.id !== id) }))
    get().refresh()
  },

  addSale: async (r) => {
    const rec = await farmService.addSale(r)
    set(s => ({ sales: [rec, ...s.sales] }))
    get().refresh()
  },
  updateSaleStatus: async (id: string, status: string) => {
    const rec = await farmService.updateSaleStatus(id, status)
    set(s => ({ sales: s.sales.map(x => x.id === id ? rec : x) }))
    get().refresh()
  },
  deleteSale: async (id) => {
    await farmService.deleteSale(id)
    set(s => ({ sales: s.sales.filter(x => x.id !== id) }))
    get().refresh()
  },

  addOtherSale: async (r) => {
    const rec = await farmService.addOtherSale(r)
    if (r.item === 'Hens') {
      const pens = await farmService.getPens()
      set(s => ({ otherSales: [rec, ...s.otherSales], pens }))
    } else {
      set(s => ({ otherSales: [rec, ...s.otherSales] }))
    }
    get().refresh()
  },
  deleteOtherSale: async (id) => {
    const rec = get().otherSales.find(x => x.id === id)
    await farmService.deleteOtherSale(id)
    if (rec?.item === 'Hens') {
      const pens = await farmService.getPens()
      set(s => ({ otherSales: s.otherSales.filter(x => x.id !== id), pens }))
    } else {
      set(s => ({ otherSales: s.otherSales.filter(x => x.id !== id) }))
    }
    get().refresh()
  },

  addWorker: async (r) => {
    const rec = await farmService.addWorker(r)
    set(s => ({ workers: [rec, ...s.workers] }))
    get().refresh()
  },
  updateWorker: async (id, r) => {
    const rec = await farmService.updateWorker(id, r)
    set(s => ({ workers: s.workers.map(w => w.id === id ? rec : w) }))
    get().refresh()
  },
  deleteWorker: async (id) => {
    await farmService.deleteWorker(id)
    set(s => ({ workers: s.workers.filter(x => x.id !== id) }))
    get().refresh()
  },

  addPayroll: async (r) => {
    const rec = await farmService.addPayroll(r)
    set(s => ({ payroll: [rec, ...s.payroll] }))
    get().refresh()
  },

  addPen: async (r) => {
    const rec = await farmService.addPen(r)
    set(s => ({ pens: [...s.pens, rec] }))
    get().refresh()
  },
  updatePen: async (id, r) => {
    const rec = await farmService.updatePen(id, r)
    set(s => ({ pens: s.pens.map(p => p.id === id ? rec : p) }))
    get().refresh()
  },
  deletePen: async (id) => {
    await farmService.deletePen(id)
    set(s => ({ pens: s.pens.filter(p => p.id !== id) }))
    get().refresh()
  },
}))

export function useTotals() {
  const { production, expenses, sales, otherSales, workers, mortality, pens, payroll } = useFarmStore()
  const goodEggs = production.reduce((s, r) => s + r.goodEggs, 0)
  const salaryCost = payroll.reduce((s, p) => s + p.amount, 0)
  const otherCost = expenses.reduce((s, r) => s + r.amount, 0)
  const totalExpenses = salaryCost + otherCost
  const eggRevenue = sales.reduce((s, r) => s + r.total, 0)
  const otherRevenue = (otherSales ?? []).reduce((s, r) => s + r.total, 0)
  const totalRevenue = eggRevenue + otherRevenue
  const profit = totalRevenue - totalExpenses
  const costPerEgg = goodEggs > 0 ? totalExpenses / goodEggs : 0
  const costPerCrate = costPerEgg * 30
  const totalBirds = pens.reduce((s, p) => s + p.totalBirds, 0)
  const totalMortality = mortality.reduce((s, r) => s + r.count, 0)
  const availableBirds = totalBirds - totalMortality
  const unpaidDebt = [...sales, ...(otherSales ?? [])]
    .filter(s => s.status === 'Unpaid')
    .reduce((s, r) => s + r.total, 0)
  const monthlySalaryBill = workers.reduce((s, w) => s + w.salary, 0)
  // Expense breakdown by category
  const expByCategory = (cat: string) => expenses.filter(e => e.category === cat).reduce((s, r) => s + r.amount, 0)
  return {
    goodEggs, salaryCost, otherCost, totalExpenses,
    eggRevenue, otherRevenue, totalRevenue,
    profit, costPerEgg, costPerCrate,
    availableBirds, totalMortality, unpaidDebt, totalBirds,
    monthlySalaryBill, expByCategory,
  }
}

export function usePenTotals(penId: string) {
  const { production, mortality, pens } = useFarmStore()
  const pen = pens.find(p => p.id === penId)
  const penProduction = production.filter(r => r.penId === penId)
  const penMortality = mortality.filter(r => r.penId === penId)
  const goodEggs = penProduction.reduce((s, r) => s + r.goodEggs, 0)
  const deaths = penMortality.reduce((s, r) => s + r.count, 0)
  const availableBirds = (pen?.totalBirds ?? 0) - deaths
  return { goodEggs, deaths, availableBirds, totalBirds: pen?.totalBirds ?? 0 }
}
