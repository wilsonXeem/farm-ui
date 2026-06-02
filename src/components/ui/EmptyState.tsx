interface EmptyStateProps {
  message?: string
}
export default function EmptyState({ message = 'No records yet.' }: EmptyStateProps) {
  return (
    <div className="text-center py-10 text-stone-400 text-sm">{message}</div>
  )
}
