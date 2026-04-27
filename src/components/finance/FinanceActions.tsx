"use client"

import { useState } from "react"
import { deleteExpense } from "@/actions/finance"
import { useRouter } from "next/navigation"

export default function FinanceActions({ expenseId }: { expenseId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Eliminar este gasto?")) return
    setLoading(true)
    try {
      await deleteExpense(expenseId)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-destructive border border-border/50 hover:border-destructive/50 px-2 py-1 transition-colors rounded-none"
    >
      ELIMINAR
    </button>
  )
}