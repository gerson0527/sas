"use client"

import { useState } from "react"
import { registerPayment } from "@/actions/customers"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Customer = {
  id: string
  name: string
  phone: string | null
  document: string | null
  balance: number
  creditLimit: number
}

export default function CustomerActions({ customer, storeId, onPayment }: { customer: Customer; storeId: string; onPayment?: () => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(customer.balance > 0 ? customer.balance.toString() : "")

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    formData.set("amount", amount)
    formData.set("notes", "Pago registrado")
    try {
      await registerPayment(customer.id, storeId, formData)
      if (onPayment) onPayment()
      router.refresh()
      setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {customer.balance > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <button className="inline-flex items-center justify-center h-7 px-2 text-[9px] font-bold uppercase tracking-widest border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary rounded-none transition-colors">
              COBRAR
            </button>
          } />
          <DialogContent className="rounded-none border-border bg-background sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-sm text-primary">
                REGISTRAR PAGO
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePayment} className="space-y-4 py-4">
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-none">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Cliente</p>
                <p className="text-sm font-bold uppercase">{customer.name}</p>
                <p className="text-xs text-destructive mt-1 font-bold">Deuda: ${customer.balance.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">MONTO A PAGAR</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={customer.balance}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-none uppercase tracking-widest font-bold h-10">
                {loading ? "REGISTRANDO..." : "CONFIRMAR PAGO"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}