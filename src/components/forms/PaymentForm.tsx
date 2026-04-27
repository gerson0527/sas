"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerPayment } from "@/actions/customers"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function PaymentForm({ 
  customerId, 
  storeId, 
  onSuccess 
}: { 
  customerId: string; 
  storeId: string; 
  onSuccess?: () => void 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await registerPayment(customerId, storeId, formData)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
          MONTO A ABONAR
        </label>
        <Input 
          name="amount" 
          type="number"
          step="0.01"
          min="0.01"
          required 
          className="rounded-none border-border bg-card/30 focus-visible:ring-primary h-10 text-xs font-mono uppercase" 
          placeholder="0.00"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
          NOTAS
        </label>
        <textarea 
          name="notes" 
          className="flex w-full border border-border rounded-none bg-card/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-xs font-mono uppercase min-h-[80px]" 
          placeholder="EJ: ABONO EN EFECTIVO"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={loading}
        className="rounded-none uppercase tracking-widest text-[10px] font-bold mt-4"
      >
        {loading ? "REGISTRANDO..." : "REGISTRAR ABONO"}
      </Button>
    </form>
  )
}
