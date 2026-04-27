"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCustomer, updateCustomer } from "@/actions/customers"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function CustomerForm({ 
  storeId, 
  initialData, 
  onSuccess 
}: { 
  storeId: string; 
  initialData?: any; 
  onSuccess?: () => void 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      if (initialData?.id) {
        await updateCustomer(initialData.id, storeId, formData)
      } else {
        await createCustomer(storeId, formData)
      }
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
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
            NOMBRE
          </label>
          <Input 
            name="name" 
            defaultValue={initialData?.name} 
            required 
            className="rounded-none border-border bg-card/30 focus-visible:ring-primary h-10 text-xs font-mono uppercase" 
            placeholder="JOHN DOE"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
            DOCUMENTO / NIT
          </label>
          <Input 
            name="document" 
            defaultValue={initialData?.document} 
            className="rounded-none border-border bg-card/30 focus-visible:ring-primary h-10 text-xs font-mono uppercase" 
            placeholder="123456789"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
            EMAIL
          </label>
          <Input 
            name="email" 
            type="email"
            defaultValue={initialData?.email} 
            className="rounded-none border-border bg-card/30 focus-visible:ring-primary h-10 text-xs font-mono uppercase" 
            placeholder="JOHN@EXAMPLE.COM"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
            TELÉFONO
          </label>
          <Input 
            name="phone" 
            defaultValue={initialData?.phone} 
            className="rounded-none border-border bg-card/30 focus-visible:ring-primary h-10 text-xs font-mono uppercase" 
            placeholder="555-1234"
          />
        </div>

        <div className="flex flex-col gap-2 col-span-2">
          <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
            DIRECCIÓN
          </label>
          <Input 
            name="address" 
            defaultValue={initialData?.address} 
            className="rounded-none border-border bg-card/30 focus-visible:ring-primary h-10 text-xs font-mono uppercase" 
            placeholder="CALLE FALSA 123"
          />
        </div>

        <div className="flex flex-col gap-2 col-span-2">
          <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
            LÍMITE DE CRÉDITO
          </label>
          <Input 
            name="creditLimit" 
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialData?.creditLimit ?? 0} 
            className="rounded-none border-border bg-card/30 focus-visible:ring-primary h-10 text-xs font-mono uppercase" 
            placeholder="0.00"
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        disabled={loading}
        className="rounded-none uppercase tracking-widest text-[10px] font-bold"
      >
        {loading ? "GUARDANDO..." : "GUARDAR CLIENTE"}
      </Button>
    </form>
  )
}
