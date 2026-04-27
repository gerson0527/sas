"use client"

import { useState, useEffect } from "react"
import { createSaleReturn } from "@/actions/sales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { alert } from "@/lib/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type SaleItem = {
  id: string
  productId: string
  quantity: number
  price: number
  product?: { name: string }
}

type Sale = {
  id: string
  total: number
  createdAt: Date
  items: SaleItem[]
  shiftId?: string
  customer?: { name: string }
}

const RETURN_REASONS = [
  "PRODUCTO DAÑADO",
  "NO FUNCIONA",
  "NO ERA LO QUE QUERÍA",
  "TALLA/DISEÑO INCORRECTO",
  "OTRO"
]

export function ReturnDialog({ storeId, currentShift }: { storeId: string, currentShift: any }) {
  const [open, setOpen] = useState(false)
  const [saleId, setSaleId] = useState("")
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<{ productId: string, quantity: number }[]>([])
  const [reason, setReason] = useState("")
  const [refundMethod, setRefundMethod] = useState<"CASH" | "CREDIT">("CASH")

  const fetchSale = async (id: string) => {
    try {
      const response = await fetch(`/api/sales/${id}?storeId=${storeId}`)
      const data = await response.json()
      if (data) {
        setSale(data)
        setSelectedItems(data.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })))
      } else {
        alert.error("Venta no encontrada")
      }
    } catch {
      alert.error("Error al buscar venta")
    }
  }

  const handleQuantityChange = (productId: string, qty: number) => {
    const item = sale?.items.find(i => i.productId === productId)
    if (!item || qty > item.quantity || qty < 0) return
    
    setSelectedItems(prev => prev.map(p => 
      p.productId === productId ? { ...p, quantity: qty } : p
    ))
  }

  const handleReturn = async () => {
    if (!sale || selectedItems.length === 0 || !reason) {
      alert.error("Complete todos los campos")
      return
    }

    const itemsToReturn = selectedItems.filter(i => i.quantity > 0)
    if (itemsToReturn.length === 0) {
      alert.error("Seleccione al menos un producto")
      return
    }

    setLoading(true)
    try {
      const itemsToReturn = selectedItems.filter(i => i.quantity > 0).map(item => {
        const saleItem = sale?.items.find(i => i.productId === item.productId)
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: saleItem?.price || 0
        }
      })
      
      await createSaleReturn(
        sale.id,
        itemsToReturn,
        reason,
        refundMethod
      )
      alert.success("DEVOLUCIÓN PROCESADA")
      setOpen(false)
      setSaleId("")
      setSale(null)
      setSelectedItems([])
      setReason("")
    } catch (error: any) {
      alert.error(error.message || "ERROR AL PROCESAR DEVOLUCIÓN")
    } finally {
      setLoading(false)
    }
  }

  const returnTotal = selectedItems.reduce((sum, item) => {
    const saleItem = sale?.items.find(i => i.productId === item.productId)
    return sum + (saleItem ? saleItem.price * item.quantity : 0)
  }, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="text-[10px] border border-destructive/30 text-destructive px-3 py-2 hover:bg-destructive/10 transition-colors rounded-none disabled:opacity-30">
          DEVOLVER
        </button>
      } />
      <DialogContent className="sm:max-w-[600px] rounded-none border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest font-bold text-primary">
            DEVOLUCIÓN DE VENTA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="ID DE VENTA (ej. abc123…)"
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              className="flex-1 uppercase"
            />
            <Button 
              onClick={() => fetchSale(saleId)}
              className="rounded-none uppercase"
              disabled={!saleId}
            >
              BUSCAR
            </Button>
          </div>

          {sale && (
            <>
              <div className="border border-border p-3 rounded-none">
                <div className="text-xs uppercase text-muted-foreground mb-2">
                  VENTA #{sale.id.slice(-6)} - ${sale.total.toLocaleString()}
                </div>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {sale.items.map(item => {
                    const selected = selectedItems.find(s => s.productId === item.productId)
                    const qty = selected?.quantity || 0
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="uppercase">{item.product?.name || item.productId}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">x{item.quantity}</span>
                          <Input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={qty}
                            onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                            className="w-16 h-7 text-center rounded-none"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-muted-foreground block mb-1">MOTIVO</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-10 border border-border bg-card px-3 rounded-none text-xs uppercase"
                >
                  <option value="">SELECCIONAR MOTIVO</option>
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-muted-foreground block mb-1">REEMBOLSO</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as any)}
                  className="w-full h-10 border border-border bg-card px-3 rounded-none text-xs uppercase"
                >
                  <option value="CASH">EFECTIVO</option>
                  <option value="CREDIT">CRÉDITO A CUENTA</option>
                </select>
              </div>

              <div className="border border-primary p-3 rounded-none bg-primary/10">
                <div className="text-xs uppercase text-muted-foreground">TOTAL A DEVOLVER</div>
                <div className="text-2xl font-bold text-primary">
                  ${returnTotal.toLocaleString()}
                </div>
              </div>

              <Button 
                onClick={handleReturn}
                disabled={loading || !reason || returnTotal === 0}
                className="w-full rounded-none uppercase font-bold h-12 bg-destructive hover:bg-destructive/90"
              >
                {loading ? "PROCESANDO..." : "CONFIRMAR DEVOLUCIÓN"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}