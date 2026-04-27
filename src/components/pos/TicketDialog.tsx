"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type SaleItem = {
  name: string
  quantity: number
  price: number
}

type TicketProps = {
  open: boolean
  onClose: () => void
  items: SaleItem[]
  subtotal: number
  iva: number
  total: number
  paymentMethod: string
  customerName?: string
  saleId?: string
}

export function TicketDialog({
  open,
  onClose,
  items,
  subtotal,
  iva,
  total,
  paymentMethod,
  customerName,
  saleId
}: TicketProps) {
  const handlePrint = () => {
    window.print()
  }

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "CASH": return "EFECTIVO"
      case "CARD": return "TARJETA"
      case "TRANSFER": return "TRANSFERENCIA"
      case "DEBT": return "FIADO"
      case "NEQUI": return "NEQUI"
      default: return method
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[320px] rounded-none border border-border bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center uppercase font-bold text-sm">
            TICKET DE VENTA
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-[10px] font-mono space-y-2 p-2 bg-white text-black" id="ticket-content">
          <div className="text-center border-b border-black pb-2">
            <p className="font-bold text-xs">SAAS INVENTORY</p>
            <p>PUNTO DE VENTA</p>
            <p className="text-[8px]">{new Date().toLocaleString("es-CO", { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>

          {saleId && (
            <div className="text-center">
              <p className="text-[8px]">NÚMERO: #{saleId.slice(-8)}</p>
            </div>
          )}

          <div className="border-t border-b border-black py-1">
            <div className="flex justify-between text-[8px] font-bold">
              <span className="flex-1">PRODUCTO</span>
              <span className="w-10 text-center">CANT</span>
              <span className="w-20 text-right">VALOR</span>
            </div>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-[8px]">
              <span className="flex-1 truncate mr-1">{item.name}</span>
              <span className="w-10 text-center">x{item.quantity}</span>
              <span className="w-20 text-right">${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}

          <div className="border-t border-black pt-1">
            <div className="flex justify-between text-[8px]">
              <span>SUBTOTAL:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[8px]">
              <span>IVA (19%):</span>
              <span>${iva.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold border-t border-black mt-1 pt-1">
              <span>TOTAL:</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center border-t border-b border-black py-1">
            <p className="text-[9px] font-bold uppercase">METODO DE PAGO: {getPaymentLabel(paymentMethod)}</p>
            {customerName && (
              <p className="text-[8px]">CLIENTE: {customerName}</p>
            )}
          </div>

          <div className="text-center pt-2">
            <p className="text-[8px]">GRACIAS POR SU COMPRA</p>
            <p className="text-[7px]">SAAS INVENTORY v1.0</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handlePrint}
            className="flex-1 rounded-none uppercase text-xs font-bold"
          >
            IMPRIMIR
          </Button>
          <Button 
            onClick={onClose}
            className="flex-1 rounded-none uppercase text-xs font-bold bg-primary"
          >
            CERRAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}