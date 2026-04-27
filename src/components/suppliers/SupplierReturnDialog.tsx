"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { returnToSupplier } from "@/actions/suppliers"
import { alert } from "@/lib/alert"

type Product = {
  id: string
  name: string
  stock: number
  cost: number | null
}

type Supplier = {
  id: string
  name: string
}

const RETURN_REASONS = [
  "PRODUCTO DAÑADO",
  "VENCIDO",
  "NO COINCIDE CON PEDIDO",
  "MAL ESTADO",
  "OTRO"
]

export function SupplierReturnDialog({ supplier, products }: { supplier: Supplier, products: Product[] }) {
  const [open, setOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<{ productId: string, quantity: number, reason: string }[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 0) return
    setSelectedItems(prev => {
      const existing = prev.find(p => p.productId === productId)
      if (existing) {
        return prev.map(p => 
          p.productId === productId ? { ...p, quantity } : p
        )
      }
      return [...prev, { productId, quantity, reason: "" }]
    })
  }

  const handleReasonChange = (productId: string, reason: string) => {
    setSelectedItems(prev => prev.map(p => 
      p.productId === productId ? { ...p, reason } : p
    ))
  }

  const handleReturn = async () => {
    const itemsToReturn = selectedItems.filter(i => i.quantity > 0 && i.reason)
    if (itemsToReturn.length === 0) {
      alert.error("Seleccione productos y motivo")
      return
    }

    setLoading(true)
    try {
      for (const item of itemsToReturn) {
        const formData = new FormData()
        formData.append("productId", item.productId)
        formData.append("supplierId", supplier.id)
        formData.append("quantity", item.quantity.toString())
        formData.append("notes", notes)
        await returnToSupplier(formData)
      }
      alert.success("DEVOLUCIÓN REGISTRADA", "Se realise la devolución exitosamente.")
      setOpen(false)
      setSelectedItems([])
      setNotes("")
    } catch (err: any) {
      alert.error("ERROR", err.message || "No se pudo procesar la devolución.")
    } finally {
      setLoading(false)
    }
  }

  const returnTotal = selectedItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)
    return sum + (product?.cost || 0) * item.quantity
  }, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="text-[10px] border border-destructive/30 text-destructive px-2 py-1 hover:bg-destructive/10 transition-colors rounded-none uppercase">
          DEVOLUCIÓN
        </button>
      } />
      <DialogContent className="sm:max-w-[600px] rounded-none border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest font-bold text-primary">
            DEVOLUCIÓN A: {supplier.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {products.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 uppercase text-xs">
              NO HAY PRODUCTOS DE ESTE PROVEEDOR
            </div>
          ) : (
            <>
              <div className="max-h-[300px] overflow-y-auto border border-border">
                <table className="w-full text-xs uppercase">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">PRODUCTO</th>
                      <th className="p-2 text-center">STOCK</th>
                      <th className="p-2 text-center">CANT</th>
                      <th className="p-2 text-left">MOTIVO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const selected = selectedItems.find(s => s.productId === product.id)
                      return (
                        <tr key={product.id} className="border-t border-border">
                          <td className="p-2">{product.name}</td>
                          <td className="p-2 text-center">{product.stock}</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={0}
                              max={product.stock}
                              value={selected?.quantity || 0}
                              onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                              className="h-7 w-20 text-center rounded-none"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={selected?.reason || ""}
                              onChange={(e) => handleReasonChange(product.id, e.target.value)}
                              className="h-7 bg-card border border-border rounded-none text-xs"
                            >
                              <option value="">MOTIVO</option>
                              {RETURN_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Input
                placeholder="OBSERVACIONES ADICIONALES (OPCIONAL)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="uppercase"
              />

              <div className="border border-primary p-3 rounded-none bg-primary/10">
                <div className="text-xs uppercase text-muted-foreground">TOTAL DE DEVOLUCIÓN</div>
                <div className="text-2xl font-bold text-primary">
                  ${returnTotal.toLocaleString()}
                </div>
              </div>

              <Button 
                onClick={handleReturn}
                disabled={loading || returnTotal === 0}
                className="w-full rounded-none uppercase font-bold h-12 bg-destructive hover:bg-destructive/90"
              >
                {loading ? "REGISTRANDO..." : "CONFIRMAR DEVOLUCIÓN"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}