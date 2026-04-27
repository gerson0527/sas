"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteCategory } from "@/actions/categories"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CategoryForm } from "@/components/forms/CategoryForm"
import { toast } from "sonner"

export function CategoryActions({ category, storeId, parentCategories = [] }: { category: any, storeId: string, parentCategories?: any[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const availableParents = parentCategories.filter((c: any) => c.id !== category.id)

  const handleDelete = async () => {
    if (!confirm("¿Está seguro de que desea eliminar esta categoría?")) return
    try {
      setIsDeleting(true)
      await deleteCategory(category.id)
      toast.success("Categoría eliminada con éxito")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar la categoría")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex justify-end gap-2" suppressHydrationWarning>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={
          <Button variant="ghost" size="sm" className="rounded-none uppercase tracking-widest text-xs text-muted-foreground hover:text-primary hover:bg-primary/10">
            EDITAR
          </Button>
        } />
        <DialogContent className="sm:max-w-[500px] rounded-none border border-border bg-background shadow-2xl shadow-primary/10">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-primary flex items-center gap-2">
              <span className="h-2 w-2 bg-primary inline-block"></span>
              EDITAR CATEGORÍA
            </DialogTitle>
          </DialogHeader>
          <CategoryForm 
            storeId={storeId} 
            categories={availableParents} 
            initialData={category} 
            onSuccess={() => setOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-none uppercase tracking-widest text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        ELIMINAR
      </Button>
    </div>
  )
}