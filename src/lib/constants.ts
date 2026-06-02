export const APP_NAME = 'PFFMS'
export const APP_TAGLINE = 'Poultry Farm Financial Management System'

export const ROLES = ['Admin', 'Farm Manager', 'Accountant', 'Sales', 'Staff'] as const
export type Role = typeof ROLES[number]

export const EXPENSE_CATEGORIES = [
  'Fuel', 'Construction', 'Salary', 'Medication',
  'Repairs', 'Transport', 'Electricity', 'Water', 'Miscellaneous',
] as const

export const EGGS_PER_CRATE = 30
export const DEFAULT_PROFIT_MARGIN = 25

export const AUTH_KEY = 'pffms-auth'
