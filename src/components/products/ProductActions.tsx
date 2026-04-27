"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteProduct } from "@/actions/products"
import { createSupplierReturn } from "@/actions/purchases"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProductForm } from "@/components/forms/ProductForm"
import { toast } from "sonner"

const RETURN_REASONS = [
  "PRODUCTO DAÑADO",
  "VENCIDO",
  "NO COINCIDE CON PEDIDO",
  "MAL ESTADO",
  "OTRO"
]

export function ProductActions({ product, storeId, categories, suppliers }: { product: any, storeId: string, categories: any[], suppliers: any[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [openReturn, setOpenReturn] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [returnQty, setReturnQty] = useState(1)
  const [returnReason, setReturnReason] = useState("")
  const [returnNotes, setReturnNotes] = useState("")
  const [returnSupplierId, setReturnSupplierId] = useState(suppliers[0]?.id || "")
  const [isReturning, setIsReturning] = useState(false)

  const handleDelete = async () => {
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) return
    try {
      setIsDeleting(true)
      await deleteProduct(product.id)
      toast.success("Producto eliminado con éxito")
      router.refresh()
    } catch (error) {
      toast.error("No se pudo eliminar el producto")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReturn = async () => {
    if (!returnSupplierId) {
      toast.error("SELECCIONE PROVEEDOR")
      return
    }
    if (returnQty <= 0 || returnQty > product.stock) {
      toast.error("CANTIDAD INVÁLIDA")
      return
    }
    if (!returnReason) {
      toast.error("SELECCIONE MOTIVO")
      return
    }
    
    try {
      setIsReturning(true)
      await createSupplierReturn(returnSupplierId, [{
        productId: product.id,
        quantity: returnQty,
        cost: product.cost || 0,
        reason: returnReason
      }], returnNotes)
      toast.success("DEVOLUCIÓN REGISTRADA")
      setOpenReturn(false)
      setReturnQty(1)
      setReturnReason("")
      setReturnNotes("")
    } catch (error: any) {
      toast.error(error.message || "ERROR AL REGISTRAR DEVOLUCIÓN")
    } finally {
      setIsReturning(false)
    }
  }

  const returnTotal = (product.cost || 0) * returnQty

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={openReturn} onOpenChange={setOpenReturn}>
        <DialogTrigger render={
          <Button variant="ghost" size="sm" className="rounded-none uppercase tracking-widest text-[10px] font-bold border border-destructive/30 text-destructive hover:border-destructive hover:text-destructive hover:bg-destructive/10">
            DEVOLVER
          </Button>
        } />
        <DialogContent className="sm:max-w-[400px] rounded-none border border-border bg-background">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-destructive flex items-center gap-2">
              <span className="h-2 w-2 bg-destructive inline-block"></span>
              DEVOLVER PRODUCTO
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-wider font-mono">
              {product.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">PROVEEDOR</label>
              <select
                value={returnSupplierId}
                onChange={(e) => setReturnSupplierId(e.target.value)}
                className="w-full h-10 bg-card border border-border rounded-none text-xs"
              >
                <option value="">SELECCIONE PROVEEDOR</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">CANTIDAD (STOCK: {product.stock})</label>
              <Input
                type="number"
                min={1}
                max={product.stock}
                value={returnQty}
                onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
                className="h-10 rounded-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">MOTIVO</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full h-10 bg-card border border-border rounded-none text-xs"
              >
                <option value="">SELECCIONE MOTIVO</option>
                {RETURN_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <Input
              placeholder="OBSERVACIONES (OPCIONAL)"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="uppercase text-xs"
            />

            <div className="border border-destructive/30 p-3 rounded-none bg-destructive/10">
              <div className="text-[10px] uppercase text-muted-foreground">TOTAL DEVOLUCIÓN</div>
              <div className="text-xl font-bold text-destructive">
                ${returnTotal.toLocaleString()}
              </div>
            </div>

            <Button 
              onClick={handleReturn}
              disabled={isReturning || returnQty <= 0}
              className="w-full rounded-none uppercase font-bold h-12 bg-destructive hover:bg-destructive/90"
            >
              {isReturning ? "REGISTRANDO..." : "CONFIRMAR DEVOLUCIÓN"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              EDITAR PRODUCTO
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-wider font-mono">
              Modificar detalles para {product.name}
            </DialogDescription>
          </DialogHeader>
          <ProductForm storeId={storeId} categories={categories} suppliers={suppliers} initialData={product} onSuccess={() => setOpen(false)} />
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
