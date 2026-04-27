"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSuppliers, getSupplierProducts, deleteSupplier } from "@/actions/suppliers"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SupplierForm } from "@/components/forms/SupplierForm"
import { SupplierReturnDialog } from "@/components/suppliers/SupplierReturnDialog"
import { alert } from "@/lib/alert"

type SupplierType = {
  id: string
  name: string
  email: string | null
  phone: string | null
  _count?: { products: number }
}

type ProductType = {
  id: string
  name: string
  stock: number
  cost: number | null
}

export function SuppliersClient({ storeId, initialSuppliers }: { storeId: string, initialSuppliers: SupplierType[] }) {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(null)
  const [products, setProducts] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierType | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    setSuppliers(initialSuppliers)
  }, [initialSuppliers])

  const handleViewReturn = async (supplier: SupplierType) => {
    setLoading(true)
    try {
      const prods = await getSupplierProducts(supplier.id)
      setProducts(prods)
      setSelectedSupplier(supplier)
    } catch (error) {
      alert.error("Error al cargar productos")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿ELIMINAR ESTE PROVEEDOR?")) return
    try {
      await deleteSupplier(id)
      alert.success("PROVEEDOR ELIMINADO", "El registro fue eliminado del sistema.")
      setSuppliers(prev => prev.filter(s => s.id !== id))
      router.refresh()
    } catch (error: any) {
      alert.error("Error al eliminar", error.message || "No se pudo eliminar el proveedor.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <table className="w-full text-left text-sm font-mono uppercase">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3 font-medium">NOMBRE</th>
              <th className="p-3 font-medium">EMAIL</th>
              <th className="p-3 font-medium">TELÉFONO</th>
              <th className="p-3 font-medium text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground/50 uppercase text-xs">
                  NO HAY PROVEEDORES REGISTRADOS
                </td>
              </tr>
            ) : (
              suppliers.map(supplier => (
                <tr key={supplier.id} className="border-b border-border hover:bg-primary/5">
                  <td className="p-3 font-bold">{supplier.name}</td>
                  <td className="p-3 text-muted-foreground">{supplier.email || "—"}</td>
                  <td className="p-3 text-muted-foreground">{supplier.phone || "—"}</td>
                  <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingSupplier(supplier)
                            setEditOpen(true)
                          }}
                          className="rounded-none uppercase tracking-widest text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          EDITAR
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(supplier.id)}
                          className="rounded-none uppercase tracking-widest text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          ELIMINAR
                        </Button>
                      </div>
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedSupplier && products.length > 0 && (
        <SupplierReturnDialog 
          supplier={selectedSupplier} 
          products={products} 
        />
      )}

      {editingSupplier && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-none border border-border bg-background">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">EDITAR PROVEEDOR</DialogTitle>
            </DialogHeader>
            <SupplierForm 
              storeId={storeId} 
              initialData={editingSupplier}
              onSuccess={() => setEditOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}