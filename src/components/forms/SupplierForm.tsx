"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupplier, updateSupplier } from "@/actions/suppliers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { alert } from "@/lib/alert"

export function SupplierForm({ storeId, initialData, onSuccess }: { storeId: string, initialData?: any, onSuccess?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true)
      if (initialData?.id) {
        await updateSupplier(initialData.id, formData)
        alert.success("PROVEEDOR ACTUALIZADO", "Los datos fueron guardados correctamente.")
      } else {
        await createSupplier(formData)
        alert.success("PROVEEDOR CREADO", "El proveedor fue registrado en el sistema.")
      }
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error) {
      alert.error("ERROR", "No se pudo procesar la solicitud.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="storeId" value={storeId} />
      
      <div className="grid gap-2">
        <Label htmlFor="name" className="uppercase text-xs font-bold tracking-wider">Nombre del Proveedor</Label>
        <Input 
          id="name" 
          name="name" 
          required 
          defaultValue={initialData?.name || ""}
          placeholder="ej. ACME CORP" 
          className="bg-card/30 rounded-none focus-visible:ring-primary uppercase font-mono"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email" className="uppercase text-xs font-bold tracking-wider">Correo Electrónico (Opcional)</Label>
        <Input 
          id="email" 
          name="email" 
          type="email"
          defaultValue={initialData?.email || ""}
          placeholder="contacto@acme.com" 
          className="bg-card/30 rounded-none focus-visible:ring-primary font-mono"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone" className="uppercase text-xs font-bold tracking-wider">Teléfono (Opcional)</Label>
        <Input 
          id="phone" 
          name="phone" 
          type="tel"
          defaultValue={initialData?.phone || ""}
          placeholder="+1 555-0198" 
          className="bg-card/30 rounded-none focus-visible:ring-primary font-mono"
        />
      </div>

      <Button type="submit" className="w-full rounded-none uppercase tracking-wider font-bold" disabled={loading}>
        {loading ? "PROCESANDO..." : (initialData?.id ? "ACTUALIZAR PROVEEDOR" : "GUARDAR PROVEEDOR")}
      </Button>
    </form>
  )
}
