export default function PageLoader() {
  return (
    <div className="animate-pulse space-y-5">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="h-6 w-48 bg-stone-200 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-stone-100 rounded" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-card">
            <div className="h-3 w-24 bg-stone-100 rounded mb-2" />
            <div className="h-7 w-20 bg-stone-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card">
        <div className="h-3 w-32 bg-stone-100 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 bg-stone-100 rounded flex-1" style={{ opacity: 1 - i * 0.15 }} />
              <div className="h-4 w-24 bg-stone-100 rounded" style={{ opacity: 1 - i * 0.15 }} />
              <div className="h-4 w-20 bg-stone-100 rounded" style={{ opacity: 1 - i * 0.15 }} />
              <div className="h-4 w-16 bg-stone-100 rounded" style={{ opacity: 1 - i * 0.15 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
