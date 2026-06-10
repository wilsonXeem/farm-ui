import { api } from '@/lib/api'
import type {
  ProductionRecord, MortalityRecord, InventoryItem,
  FeedPurchase, ExpenseRecord, SaleRecord, OtherSaleRecord, Worker, PayrollRecord, Pen,
} from '@/types'

export const FARM_ID = 'demo-farm-001'

export interface FarmSettings {
  id: string
  name: string
  location?: string
  totalBirds: number
  priceJumbo: number
  priceMedium: number
  priceTable: number
  bankName: string
  bankAccount: string
  bankAccountName: string
}

const dateStr = (d: string) => d?.split('T')[0] ?? d

const normProduction = (r: any): ProductionRecord => ({
  id: r.id, date: dateStr(r.date), totalEggs: r.totalEggs,
  crackedEggs: r.crackedEggs, spoiltEggs: r.spoiltEggs,
  goodEggs: r.goodEggs, notes: r.notes,
  penId: r.penId, pen: r.pen,
})

const normMortality = (r: any): MortalityRecord => ({
  id: r.id, date: dateStr(r.date), count: r.count,
  cause: r.cause ?? '', notes: r.notes,
  penId: r.penId, pen: r.pen,
})

const normInventory = (r: any): InventoryItem => ({
  id: r.id, item: r.item, qty: r.qty, unit: r.unit,
  unitPrice: r.unitPrice, minQty: r.minQty ?? 0, supplier: r.supplier,
})

const normFeed = (r: any): FeedPurchase => ({
  id: r.id, date: dateStr(r.date), item: r.item, qty: r.qty,
  unitPrice: r.unitPrice, totalCost: r.totalCost, supplier: r.supplier,
})

const CAT_MAP: Record<string, string> = {
  FUEL: 'Fuel', CONSTRUCTION: 'Construction', SALARY: 'Salary',
  MEDICATION: 'Medication', REPAIRS: 'Repairs', TRANSPORT: 'Transport',
  ELECTRICITY: 'Electricity', WATER: 'Water', MISCELLANEOUS: 'Miscellaneous',
}
export const CAT_RMAP: Record<string, string> = Object.fromEntries(
  Object.entries(CAT_MAP).map(([k, v]) => [v, k])
)

const normExpense = (r: any): ExpenseRecord => ({
  id: r.id, date: dateStr(r.date),
  category: (CAT_MAP[r.category] ?? r.category) as any,
  amount: r.amount, description: r.description,
})

const STATUS_MAP: Record<string, string> = {
  PAID: 'Paid', UNPAID: 'Unpaid', PART_PAYMENT: 'Part payment',
}
export const STATUS_RMAP: Record<string, string> = {
  'Paid': 'PAID', 'Unpaid': 'UNPAID', 'Part payment': 'PART_PAYMENT',
}

const SIZE_MAP: Record<string, string> = {
  JUMBO: 'Jumbo', MEDIUM: 'Medium', TABLE: 'Table',
}
export const SIZE_RMAP: Record<string, string> = {
  'Jumbo': 'JUMBO', 'Medium': 'MEDIUM', 'Table': 'TABLE',
}

const normSale = (r: any): SaleRecord => ({
  id: r.id, date: dateStr(r.date), customer: r.customer,
  size: (SIZE_MAP[r.size] ?? r.size ?? 'Table') as any,
  crates: r.crates, pricePerCrate: r.pricePerCrate, total: r.total,
  status: (STATUS_MAP[r.status] ?? r.status) as any,
})

const normOtherSale = (r: any): OtherSaleRecord => ({
  id: r.id, date: dateStr(r.date), item: r.item,
  qty: r.qty, unit: r.unit, unitPrice: r.unitPrice, total: r.total,
  customer: r.customer, status: (STATUS_MAP[r.status] ?? r.status) as any,
  penId: r.penId, pen: r.pen,
})

const normWorker = (r: any): Worker => ({
  id: r.id, name: r.name, role: r.role,
  type: r.type ?? 'Permanent',
  salary: r.salary, phone: r.phone,
  employedDate: dateStr(r.employedDate),
})

const normPayroll = (r: any): PayrollRecord => ({
  id: r.id, workerId: r.workerId,
  workerName: r.worker?.name ?? r.workerName ?? '',
  amount: r.amount, month: r.month, date: dateStr(r.date),
})

export const farmService = {
  getProduction:    () => api.get<any[]>(`/api/production?farmId=${FARM_ID}`).then(r => r.map(normProduction)),
  addProduction:    (d: Omit<ProductionRecord, 'id' | 'goodEggs'>) =>
    api.post<any>('/api/production', { ...d, farmId: FARM_ID }).then(normProduction),
  deleteProduction: (id: string) => api.delete(`/api/production/${id}`),

  getMortality:    () => api.get<any[]>(`/api/mortality?farmId=${FARM_ID}`).then(r => r.map(normMortality)),
  addMortality:    (d: Omit<MortalityRecord, 'id'>) =>
    api.post<any>('/api/mortality', { ...d, farmId: FARM_ID }).then(normMortality),
  deleteMortality: (id: string) => api.delete(`/api/mortality/${id}`),

  getInventory:    () => api.get<any[]>(`/api/inventory?farmId=${FARM_ID}`).then(r => r.map(normInventory)),
  addInventory:    (d: Omit<InventoryItem, 'id'>) =>
    api.post<any>('/api/inventory', { ...d, farmId: FARM_ID }).then(normInventory),
  deleteInventory: (id: string) => api.delete(`/api/inventory/${id}`),

  getFeed:         () => api.get<any[]>(`/api/feed?farmId=${FARM_ID}`).then(r => r.map(normFeed)),
  addFeed:         (d: Omit<FeedPurchase, 'id'>) =>
    api.post<any>('/api/feed', { ...d, farmId: FARM_ID }).then(normFeed),
  deleteFeed:      (id: string) => api.delete(`/api/feed/${id}`),

  getExpenses:     () => api.get<any[]>(`/api/expenses?farmId=${FARM_ID}`).then(r => r.map(normExpense)),
  addExpense:      (d: Omit<ExpenseRecord, 'id'>) =>
    api.post<any>('/api/expenses', { ...d, category: CAT_RMAP[d.category] ?? d.category, farmId: FARM_ID }).then(normExpense),
  deleteExpense:   (id: string) => api.delete(`/api/expenses/${id}`),

  getSales:        () => api.get<any[]>(`/api/sales?farmId=${FARM_ID}`).then(r => r.map(normSale)),
  addSale:         (d: Omit<SaleRecord, 'id'>) =>
    api.post<any>('/api/sales', { ...d, size: SIZE_RMAP[d.size] ?? d.size, status: STATUS_RMAP[d.status] ?? d.status, farmId: FARM_ID }).then(normSale),
  updateSaleStatus: (id: string, status: string) =>
    api.patch<any>(`/api/sales/${id}/status`, { status: STATUS_RMAP[status] ?? status }).then(normSale),
  deleteSale:      (id: string) => api.delete(`/api/sales/${id}`),

  getOtherSales:    () => api.get<any[]>(`/api/other-sales?farmId=${FARM_ID}`).then(r => r.map(normOtherSale)),
  addOtherSale:     (d: Omit<OtherSaleRecord, 'id'>) =>
    api.post<any>('/api/other-sales', { ...d, status: STATUS_RMAP[d.status] ?? d.status, farmId: FARM_ID }).then(normOtherSale),
  deleteOtherSale:  (id: string) => api.delete(`/api/other-sales/${id}`),

  getWorkers:      () => api.get<any[]>(`/api/workers?farmId=${FARM_ID}`).then(r => r.map(normWorker)),
  addWorker:       (d: Omit<Worker, 'id'>) =>
    api.post<any>('/api/workers', { ...d, farmId: FARM_ID }).then(normWorker),
  updateWorker:    (id: string, d: Partial<Omit<Worker, 'id'>>) =>
    api.patch<any>(`/api/workers/${id}`, d).then(normWorker),
  deleteWorker:    (id: string) => api.delete(`/api/workers/${id}`),

  getPayroll:      () => api.get<any[]>(`/api/payroll?farmId=${FARM_ID}`).then(r => r.map(normPayroll)),
  addPayroll:      (d: Omit<PayrollRecord, 'id'>) =>
    api.post<any>('/api/payroll', { ...d, farmId: FARM_ID }).then(normPayroll),

  getPens:    () => api.get<Pen[]>(`/api/pens?farmId=${FARM_ID}`),
  addPen:     (d: Omit<Pen, 'id'>) => api.post<Pen>('/api/pens', { ...d, farmId: FARM_ID }),
  updatePen:  (id: string, d: Partial<Pen>) => api.patch<Pen>(`/api/pens/${id}`, d),
  deletePen:  (id: string) => api.delete(`/api/pens/${id}`),
  addBirds:   (penId: string, d: { date: string; count: number; notes?: string }) =>
    api.post<any>(`/api/pens/${penId}/birds`, { ...d, farmId: FARM_ID }),
  getBirdEntries: (penId: string) => api.get<any[]>(`/api/pens/${penId}/birds`),
  getAllBirdEntries: () => api.get<any[]>(`/api/pens/bird-entries?farmId=${FARM_ID}`),

  getFarmSettings: () => api.get<FarmSettings>(`/api/farms/${FARM_ID}`),
  updateFarmSettings: (d: Partial<FarmSettings>) => api.patch<FarmSettings>(`/api/farms/${FARM_ID}`, d),

  // Stock (unified inventory + feed)
  getStock:     () => api.get<any[]>(`/api/stock?farmId=${FARM_ID}`),
  createStock:  (d: { name: string; category: string; unit: string; minQty: number; supplier?: string }) =>
    api.post<any>('/api/stock', { ...d, farmId: FARM_ID }),
  deleteStock:  (id: string) => api.delete(`/api/stock/${id}`),
  stockIn:      (d: { stockId: string; date: string; qty: number; unitPrice: number; supplier?: string; notes?: string }) =>
    api.post<any>('/api/stock/in', { ...d, farmId: FARM_ID }),
  stockOut:     (d: { stockId: string; date: string; qty: number; reason?: string; penId?: string }) =>
    api.post<any>('/api/stock/out', { ...d, farmId: FARM_ID }),
  getStockMovements: (stockId?: string) =>
    api.get<any[]>(`/api/stock/movements?farmId=${FARM_ID}${stockId ? `&stockId=${stockId}` : ''}`),
  getStockBatches: (stockId: string) =>
    api.get<any[]>(`/api/stock/${stockId}/batches`),

  // Feed formulation
  getFormulas:    () => api.get<any[]>(`/api/feed-formula/formulas?farmId=${FARM_ID}`),
  createFormula:  (d: { name: string; description?: string; unit?: string; ingredients: { stockId: string }[] }) =>
    api.post<any>('/api/feed-formula/formulas', { ...d, farmId: FARM_ID }),
  deleteFormula:  (id: string) => api.delete(`/api/feed-formula/formulas/${id}`),
  getBatches:     () => api.get<any[]>(`/api/feed-formula/batches?farmId=${FARM_ID}`),
  produceBatch:   (d: any) => api.post<any>('/api/feed-formula/batches', { ...d, farmId: FARM_ID }),
  getUsages:      (batchId?: string) => api.get<any[]>(`/api/feed-formula/usage?farmId=${FARM_ID}${batchId ? `&batchId=${batchId}` : ''}`),
  recordUsage:    (d: any) => api.post<any>('/api/feed-formula/usage', { ...d, farmId: FARM_ID }),
}
