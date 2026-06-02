interface KpiCardProps {
  label: string
  value: string
  sub?: string
  color?: 'default' | 'green' | 'red' | 'blue'
}

const colorMap = {
  default: 'text-stone-900',
  green: 'text-brand-600',
  red: 'text-red-500',
  blue: 'text-blue-600',
}

export default function KpiCard({ label, value, sub, color = 'default' }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${colorMap[color]}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
