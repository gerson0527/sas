"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCategory, updateCategory } from "@/actions/categories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { alert } from "@/lib/alert"

type Category = {
  id: string
  name: string
  parentId?: string | null
}

export function CategoryForm({ 
  storeId, 
  categories = [], 
  initialData, 
  onSuccess 
}: { 
  storeId: string
  categories?: Category[]
  initialData?: Category
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasSubcategories, setHasSubcategories] = useState(!!initialData?.parentId)
  
  // Filter out current category when editing to avoid self-reference
  const parentCategories = categories.filter(c => !c.parentId && c.id !== initialData?.id)

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true)
      
      const parentId = formData.get("parentId") as string
      
      if (initialData?.id) {
        await updateCategory(initialData.id, formData)
        alert.success("CATEGORÍA ACTUALIZADA", "Los cambios fueron guardados.")
      } else {
        await createCategory(formData)
        alert.success("CATEGORÍA CREADA", "La categoría fue agregada al sistema.")
      }
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      alert.error("ERROR", error.message || "No se pudo procesar la solicitud.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="storeId" value={storeId} />
      
      <div className="grid gap-2">
        <Label htmlFor="name" className="uppercase text-xs font-bold tracking-wider">Nombre de la Categoría</Label>
        <Input 
          id="name" 
          name="name" 
          required 
          defaultValue={initialData?.name}
          placeholder="ej. ROPA" 
          className="bg-card/30 rounded-none focus-visible:ring-primary uppercase font-mono"
        />
      </div>

      {!initialData?.id && (
        <div className="flex items-center gap-2 p-3 border border-border bg-card/30">
          <input 
            type="checkbox" 
            id="hasSubcategories"
            checked={hasSubcategories}
            onChange={(e) => setHasSubcategories(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="hasSubcategories" className="text-xs uppercase font-bold tracking-wider cursor-pointer">
            ES CATEGORÍA PRINCIPAL (TENDRÁ SUBCATEGORÍAS)
          </Label>
        </div>
      )}

      {hasSubcategories && parentCategories.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="parentId" className="uppercase text-xs font-bold tracking-wider">
            {initialData?.id ? "Cambiar a Subcategoría de:" : "Seleccionar Categoría Principal:"}
          </Label>
          <select 
            id="parentId" 
            name="parentId"
            defaultValue={initialData?.parentId || ""}
            className="h-10 bg-card border border-border rounded-none px-3 text-xs uppercase"
          >
            <option value="">NINGUNA (ES PRINCIPAL)</option>
            {parentCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {!hasSubcategories && parentCategories.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="parentId" className="uppercase text-xs font-bold tracking-wider">
            {initialData?.id ? "Cambiar a Subcategoría de:" : "Categoría Principal (Opcional)"}
          </Label>
          <select 
            id="parentId" 
            name="parentId"
            defaultValue={initialData?.parentId || ""}
            className="h-10 bg-card border border-border rounded-none px-3 text-xs uppercase"
          >
            <option value="">{initialData?.id ? "ES PRINCIPAL" : "NINGUNA (ES PRINCIPAL)"}</option>
            {parentCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {parentCategories.length === 0 && !initialData?.id && (
        <p className="text-[10px] text-muted-foreground uppercase">Primero cree categorías principales</p>
      )}

      <Button type="submit" className="w-full rounded-none uppercase tracking-wider font-bold" disabled={loading}>
        {loading ? "PROCESANDO..." : (initialData?.id ? "ACTUALIZAR CATEGORÍA" : "GUARDAR CATEGORÍA")}
      </Button>
    </form>
  )
}