"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createProduct, updateProduct } from "@/actions/products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ProductForm({ storeId, categories = [], suppliers = [], initialData, onSuccess }: { storeId: string, categories?: any[], suppliers?: any[], initialData?: any, onSuccess?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true)
      if (initialData?.id) {
        await updateProduct(initialData.id, formData)
        toast.success("PRODUCTO ACTUALIZADO CON ÉXITO")
      } else {
        await createProduct(formData)
        toast.success("PRODUCTO REGISTRADO CON ÉXITO")
      }
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error(initialData?.id ? "ERROR DEL SISTEMA: NO SE PUDO ACTUALIZAR EL PRODUCTO" : "ERROR DEL SISTEMA: NO SE PUDO REGISTRAR EL PRODUCTO")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="storeId" value={storeId} />
      
      <div className="grid gap-2">
        <Label htmlFor="name" className="uppercase text-xs font-bold tracking-wider">Nombre del Producto</Label>
        <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="EJ. CHALECO TÁCTICO" className="bg-card/30 rounded-none focus-visible:ring-primary uppercase font-mono" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="categoryId" className="uppercase text-xs font-bold tracking-wider">Categoría</Label>
          <select 
            id="categoryId" 
            name="categoryId" 
            defaultValue={initialData?.categoryId || ""}
            className="flex h-9 w-full border border-input bg-card/30 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 rounded-none uppercase font-mono"
          >
            <option value="">-- SIN CLASIFICAR --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sku" className="uppercase text-xs font-bold tracking-wider">SKU / CÓDIGO DE BARRAS</Label>
          <Input id="sku" name="sku" defaultValue={initialData?.sku || ""} placeholder="123456789" className="bg-card/30 rounded-none focus-visible:ring-primary font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="supplierId" className="uppercase text-xs font-bold tracking-wider">Proveedor</Label>
          <select 
            id="supplierId" 
            name="supplierId" 
            defaultValue={initialData?.supplierId || ""}
            className="flex h-9 w-full border border-input bg-card/30 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 rounded-none uppercase font-mono"
          >
            <option value="">-- SIN PROVEEDOR --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cost" className="uppercase text-xs font-bold tracking-wider">COSTO DE COMPRA (OPCIONAL)</Label>
          <Input id="cost" name="cost" type="number" step="0.01" defaultValue={initialData?.cost ?? ""} placeholder="0.00" className="bg-card/30 rounded-none focus-visible:ring-primary font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="regularPrice" className="uppercase text-xs font-bold tracking-wider text-muted-foreground">PRECIO NORMAL (SIN DESCUENTO)</Label>
          <Input id="regularPrice" name="regularPrice" type="number" step="0.01" defaultValue={initialData?.regularPrice ?? ""} placeholder="0.00" className="bg-card/30 rounded-none focus-visible:ring-primary font-mono" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price" className="uppercase text-xs font-bold tracking-wider text-primary">PRECIO DE VENTA (FINAL)</Label>
          <Input id="price" name="price" type="number" step="0.01" required defaultValue={initialData?.price ?? ""} placeholder="0.00" className="bg-card/30 rounded-none focus-visible:ring-primary font-mono border-primary/50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="stock" className="uppercase text-xs font-bold tracking-wider">STOCK INICIAL</Label>
          <Input id="stock" name="stock" type="number" required defaultValue={initialData?.stock ?? "0"} className="bg-card/30 rounded-none focus-visible:ring-primary font-mono" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="minStock" className="uppercase text-xs font-bold tracking-wider">NIVEL DE ALERTA</Label>
          <Input id="minStock" name="minStock" type="number" required defaultValue={initialData?.minStock ?? "5"} className="bg-card/30 rounded-none focus-visible:ring-primary font-mono" />
        </div>
      </div>

      {/* Facturación Electrónica DIAN/Plemsi */}
      <div className="border-t border-border pt-4 mt-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">DATOS DE FACTURACIÓN</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="grid gap-2">
            <Label htmlFor="taxType" className="uppercase text-[10px] font-bold tracking-wider text-muted-foreground">Tipo de Impuesto</Label>
            <select 
              id="taxType" 
              name="taxType" 
              defaultValue={initialData?.taxType || "TAXED"}
              className="flex h-9 w-full border border-input bg-card/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-none uppercase font-mono"
            >
              <option value="TAXED">GRAVADO (TAXED)</option>
              <option value="EXEMPT">EXENTO (EXEMPT)</option>
              <option value="EXCLUDED">EXCLUIDO (EXCLUDED)</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="taxRate" className="uppercase text-[10px] font-bold tracking-wider text-muted-foreground">% IMPUESTO (IVA)</Label>
            <Input id="taxRate" name="taxRate" type="number" step="1" required defaultValue={initialData?.taxRate ?? "19"} placeholder="19" className="bg-card/30 rounded-none focus-visible:ring-primary font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="unitMeasure" className="uppercase text-[10px] font-bold tracking-wider text-muted-foreground">Unidad de Medida (DIAN)</Label>
            <select 
              id="unitMeasure" 
              name="unitMeasure" 
              defaultValue={initialData?.unitMeasure || "94"}
              className="flex h-9 w-full border border-input bg-card/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-none uppercase font-mono"
            >
              <option value="94">94 - UNIDAD</option>
              <option value="KGM">KGM - KILOGRAMO</option>
              <option value="LTR">LTR - LITRO</option>
              <option value="MTR">MTR - METRO</option>
              <option value="MTK">MTK - METRO CUADRADO</option>
              <option value="MTQ">MTQ - METRO CÚBICO</option>
              <option value="DAY">DAY - DÍA</option>
              <option value="HUR">HUR - HORA</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="standardCode" className="uppercase text-[10px] font-bold tracking-wider text-muted-foreground">CÓDIGO UNSPSC (Opcional)</Label>
            <Input id="standardCode" name="standardCode" defaultValue={initialData?.standardCode || ""} placeholder="EJ: 43211500" className="bg-card/30 rounded-none focus-visible:ring-primary font-mono" />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full rounded-none uppercase tracking-wider font-bold mt-4" disabled={loading}>
        {loading ? "PROCESANDO..." : (initialData?.id ? "ACTUALIZAR PRODUCTO" : "GUARDAR PRODUCTO")}
      </Button>
    </form>
  )
}
