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

export interface SaleRecord {
  id: string
  date: string
  customer?: string
  crates: number
  pricePerCrate: number
  total: number
  status: 'Paid' | 'Unpaid' | 'Part payment'
}

export interface Worker {
  id: string
  name: string
  role: string
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
  addWorker: (r: Omit<Worker, 'id'>) => void
  deleteWorker: (id: string) => void
  addPayroll: (r: Omit<PayrollRecord, 'id'>) => void
  addPen: (r: Omit<Pen, 'id'>) => void
  updatePen: (id: string, r: Partial<Pen>) => void
  deletePen: (id: string) => void
}
