export interface BirdEntry {
  id: string
  date: string
  count: number
  notes?: string
  penId: string
  pen?: { name: string }
  createdAt: string
}

export interface Pen {
  id: string
  name: string
  totalBirds: number
  workerId?: string
  worker?: { id: string; name: string; role: string }
}

export interface ProductionRecord {
  id: string
  date: string
  totalEggs: number
  crackedEggs: number
  spoiltEggs: number
  goodEggs: number
  notes?: string
  penId?: string
  pen?: { id: string; name: string }
}

export interface MortalityRecord {
  id: string
  date: string
  count: number
  cause: string
  notes?: string
  penId?: string
  pen?: { id: string; name: string }
}

export type StockCategory = 'Feed' | 'Medication' | 'Equipment' | 'Supplies' | 'Other'

export interface FeedFormula {
  id: string
  name: string
  description?: string
  unit: string
  createdAt: string
  ingredients: {
    id: string
    stockId: string
    qtyPerUnit: number
    stock: { id: string; name: string; unit: string }
  }[]
  _count?: { batches: number }
}

export interface FeedBatch {
  id: string
  date: string
  batchNo: string
  formulaId: string
  formula?: { name: string; unit: string }
  qtyProduced: number
  qtyRemaining: number
  notes?: string
  createdAt: string
  _count?: { usages: number }
}

export interface FeedUsageRecord {
  id: string
  date: string
  batchId: string
  batch?: { formula?: { name: string; unit: string } }
  penId?: string
  pen?: { name: string }
  qty: number
  notes?: string
  createdAt: string
}

export interface FeedFormula {
  id: string
  name: string
  description?: string
  unit: string
  createdAt: string
  ingredients: {
    id: string
    stockId: string
    qtyPerUnit: number
    stock: { id: string; name: string; unit: string }
  }[]
  _count?: { batches: number }
}

export interface FeedBatch {
  id: string
  date: string
  batchNo: string
  formulaId: string
  formula?: { name: string; unit: string }
  qtyProduced: number
  qtyRemaining: number
  notes?: string
  createdAt: string
  _count?: { usages: number }
}

export interface FeedUsageRecord {
  id: string
  date: string
  batchId: string
  batch?: { formula?: { name: string; unit: string } }
  penId?: string
  pen?: { name: string }
  qty: number
  notes?: string
  createdAt: string
}

export interface StockItem {
  id: string
  name: string
  category: StockCategory
  unit: string
  minQty: number
  supplier?: string
  currentQty: number
  fifoCostPerUnit: number
  avgCostPerUnit: number
  totalValue: number
  createdAt: string
}

export interface StockBatch {
  id: string
  date: string
  qty: number
  remainingQty: number
  unitPrice: number
  totalCost: number
  supplier?: string
  notes?: string
  createdAt: string
}

export interface StockOut {
  id: string
  date: string
  qty: number
  costUsed: number
  reason?: string
  stockId: string
  penId?: string
  stock?: { name: string; unit: string }
  pen?: { name: string }
  createdAt: string
}

export interface StockMovement {
  id: string
  date: string
  type: 'IN' | 'OUT'
  qty: number
  reason?: string
  inventoryId: string
  inventory?: { item: string; unit: string }
}

export interface InventoryItem {
  id: string
  item: string
  qty: number
  unit: string
  unitPrice: number
  minQty: number
  supplier?: string
}

export interface FeedPurchase {
  id: string
  date: string
  item: string
  qty: number
  unitPrice: number
  totalCost: number
  supplier?: string
}

export type ExpenseCategory =
  | 'Fuel'
  | 'Construction'
  | 'Salary'
  | 'Medication'
  | 'Repairs'
  | 'Transport'
  | 'Electricity'
  | 'Water'
  | 'Miscellaneous'

export interface ExpenseRecord {
  id: string
  date: string
  category: ExpenseCategory
  amount: number
  description?: string
}

export type EggSize = 'Jumbo' | 'Medium' | 'Table'

export interface SaleRecord {
  id: string
  date: string
  customer?: string
  size: EggSize
  crates: number
  pricePerCrate: number
  total: number
  status: 'Paid' | 'Unpaid' | 'Part payment'
}

export interface OtherSaleRecord {
  id: string
  date: string
  item: string
  qty: number
  unit: string
  unitPrice: number
  total: number
  customer?: string
  status: 'Paid' | 'Unpaid' | 'Part payment'
  penId?: string
  pen?: { id: string; name: string }
}

export interface Worker {
  id: string
  name: string
  role: string
  type: 'Permanent' | 'Auxiliary'
  salary: number
  phone?: string
  employedDate: string
}

export interface PayrollRecord {
  id: string
  workerId: string
  workerName: string
  amount: number
  month: string
  date: string
}

export interface FarmStore {
  totalBirds: number
  pens: Pen[]
  production: ProductionRecord[]
  mortality: MortalityRecord[]
  inventory: InventoryItem[]
  feed: FeedPurchase[]
  expenses: ExpenseRecord[]
  sales: SaleRecord[]
  otherSales: OtherSaleRecord[]
  workers: Worker[]
  payroll: PayrollRecord[]
  addProduction: (r: Omit<ProductionRecord, 'id' | 'goodEggs'>) => void
  deleteProduction: (id: string) => void
  addMortality: (r: Omit<MortalityRecord, 'id'>) => void
  deleteMortality: (id: string) => void
  addInventory: (r: Omit<InventoryItem, 'id'>) => void
  deleteInventory: (id: string) => void
  addFeed: (r: Omit<FeedPurchase, 'id'>) => void
  deleteFeed: (id: string) => void
  addExpense: (r: Omit<ExpenseRecord, 'id'>) => void
  deleteExpense: (id: string) => void
  addSale: (r: Omit<SaleRecord, 'id'>) => void
  deleteSale: (id: string) => void
  addOtherSale: (r: Omit<OtherSaleRecord, 'id'>) => void
  deleteOtherSale: (id: string) => void
  addWorker: (r: Omit<Worker, 'id'>) => void
  updateWorker: (id: string, r: Partial<Omit<Worker, 'id'>>) => void
  deleteWorker: (id: string) => void
  addPayroll: (r: Omit<PayrollRecord, 'id'>) => void
  addPen: (r: Omit<Pen, 'id'>) => void
  updatePen: (id: string, r: Partial<Pen>) => void
  deletePen: (id: string) => void
}
