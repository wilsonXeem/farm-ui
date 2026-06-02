# PFFMS — Poultry Farm Financial Management System

A financial intelligence and cost accounting platform for poultry farms.
Built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Recharts**, and **Zustand**.

---

## Features (MVP v1)

| Module | Description |
|---|---|
| Dashboard | KPIs, charts, alerts, suggested pricing |
| Production | Daily egg tracking (total, cracked, spoilt, good) |
| Mortality | Bird death tracking, flock count |
| Inventory | Stock levels, low-stock alerts |
| Feed Costs | Feed purchases, supplier tracking |
| Expenses | All operational costs by category |
| Sales | Crate sales, debt tracking, payment status |
| Workers | Staff management |
| Payroll | Monthly salary payments |
| Pricing Engine | Cost per egg/crate, suggested price, loss detection |
| Reports | Daily / Weekly / Monthly P&L summaries |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone / extract the project

```bash
cd pffms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the dashboard with seed data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (with localStorage persistence) |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | DM Serif Display + DM Sans |

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── dashboard/
│   ├── production/
│   ├── mortality/
│   ├── inventory/
│   ├── feed/
│   ├── expenses/
│   ├── sales/
│   ├── workers/
│   ├── payroll/
│   ├── pricing/
│   └── reports/
├── components/
│   ├── layout/           # Shell, Sidebar
│   └── ui/               # KpiCard, PageHeader, DeleteBtn, EmptyState
├── store/
│   └── farmStore.ts      # Zustand store + useTotals hook
├── types/
│   └── index.ts          # All TypeScript interfaces
├── lib/
│   └── utils.ts          # fmt, fmtN, today, getLast7Days...
└── styles/
    └── globals.css       # Tailwind + custom CSS classes
```

---

## Core Business Logic

### Cost per egg
```
Total Expenses = Feed + Salaries + Other Expenses
Cost Per Egg   = Total Expenses / Total Good Eggs
Cost Per Crate = Cost Per Egg × 30
```

### Good eggs
```
Good Eggs = Total Produced - Cracked - Spoilt
```

### Profit
```
Profit = Total Revenue - Total Expenses
```

### Suggested selling price
```
Suggested Price = Cost Per Egg × (1 + Margin%)
```

---

## Data Persistence

All data is saved to **localStorage** via Zustand's `persist` middleware. No backend required for MVP. Data survives page refreshes and browser restarts.

---

## Deploying to Vercel

```bash
npm run build         # Test the production build locally
vercel deploy         # Deploy to Vercel
```

---

## Phase 2 Roadmap

- [ ] NestJS + PostgreSQL backend (REST API)
- [ ] JWT Authentication & role-based access
- [ ] PDF / Excel report export
- [ ] Multi-farm support
- [ ] SMS / WhatsApp alerts
- [ ] AI-powered feed forecasting
- [ ] Mobile app (React Native)
- [ ] Offline sync with service workers

---

## Currency

All amounts are in **Nigerian Naira (₦)**.

---

## License

MIT — built for Nigerian poultry farmers.
