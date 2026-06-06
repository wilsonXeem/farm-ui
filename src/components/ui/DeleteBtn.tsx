'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Spinner from './Spinner'

interface DeleteBtnProps {
  onDelete: () => void | Promise<void>
}

export default function DeleteBtn({ onDelete }: DeleteBtnProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm('Delete this record?')) return
    setLoading(true)
    try { await onDelete() } finally { setLoading(false) }
  }

  return (
    <button className="btn btn-danger" onClick={handleClick} disabled={loading}>
      {loading ? <Spinner size={13} /> : <Trash2 size={13} />}
    </button>
  )
}
