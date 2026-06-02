'use client'
import { Trash2 } from 'lucide-react'

interface DeleteBtnProps {
  onDelete: () => void
}

export default function DeleteBtn({ onDelete }: DeleteBtnProps) {
  return (
    <button
      className="btn btn-danger"
      onClick={() => { if (confirm('Delete this record?')) onDelete() }}
    >
      <Trash2 size={13} />
    </button>
  )
}
