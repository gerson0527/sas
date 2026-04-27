"use client"

import { useState } from "react"
import { createExpense } from "@/actions/finance"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const EXPENSE_CATEGORIES = [
  { value: "RENT", label: "Arriendo" },
  { value: "UTILITIES", label: "Servicios" },
  { value: "SUPPLIES", label: "Suministros" },
  { value: "SERVICES", label: "Servicios Varios" },
  { value: "PAYROLL", label: "Nómina" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "TRANSPORT", label: "Transporte" },
  { value: "TAXES", label: "Impuestos" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OTHER", label: "Otro" },
]

export default function ExpenseForm({ storeId }: { storeId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      await createExpense(storeId, {
        description: formData.get("description") as string,
        amount: parseFloat(formData.get("amount") as string),
        category: formData.get("category") as string,
      })
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">DESCRIPCIÓN</label>
        <input name="description" required placeholder="¿Qué gastaste?" className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase" />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">MONTO</label>
        <input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase" />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">CATEGORÍA</label>
        <select name="category" required className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase">
          {EXPENSE_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-[10px] uppercase text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full rounded-none uppercase tracking-widest font-bold h-10">
        {loading ? "REGISTRANDO..." : "REGISTRAR GASTO"}
      </Button>
    </form>
  )
}