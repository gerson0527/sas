"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type SaleItem = {
  name: string
  quantity: number
  price: number
  basePrice: number
  taxAmount: number
}

type TicketProps = {
  open: boolean
  onClose: () => void
  items: SaleItem[]
  subtotal: number
  totalTaxAmount?: number
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
  totalTaxAmount = 0,
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

  const taxAmount = total - subtotal
  const borderDashed = "border-t border-dashed border-black/60"
  const lineSeparator = <div className="border-t border-black/40 my-2" />

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[320px] rounded-none border border-border bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center uppercase font-bold text-sm">
            TICKET DE VENTA
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-[11px] font-mono bg-white text-black p-3" id="ticket-content">
          <div className="text-center pb-3 border-b border-black">
            <div className="flex justify-center items-center gap-1 mb-1">
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">S</div>
              <p className="font-bold text-sm tracking-wider">SAAS INVENTORY</p>
            </div>
            <p className="text-[9px] text-gray-600">PUNTO DE VENTA</p>
            <div className="mt-2 text-[8px] text-gray-500 space-y-0.5">
              <p>NIT: 900.XXX.XXX-X</p>
              <p>Dirección: Carrera 00 #00-00, Ciudad</p>
              <p>Tel: (XXX) XXX XX XX</p>
            </div>
            <div className="mt-2 pt-2 border-t border-black/30">
              <p className="text-[9px] font-medium">
                {new Date().toLocaleString("es-CO", { 
                  weekday: 'short',
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>

          {saleId && (
            <div className="text-center py-2">
              <div className="inline-block bg-black text-white px-3 py-1">
                <p className="text-[9px] font-bold">TICKET #: {saleId.slice(-8)}</p>
              </div>
            </div>
          )}

          <div className={borderDashed}>
            <div className="flex text-[8px] font-bold uppercase text-gray-600">
              <span className="flex-1">Artículo</span>
              <span className="w-5 text-center">Cant</span>
              <span className="w-[65px] text-right">Vlr Unit</span>
              <span className="w-8 text-center">IVA</span>
              <span className="w-14 text-right">Total</span>
            </div>
          </div>

          <div className="space-y-1.5 py-1">
            {items.map((item, idx) => {
              const unitBase = item.basePrice / item.quantity
              const unitTax = item.taxAmount / item.quantity
              const taxPct = unitBase > 0 ? Math.round((unitTax / unitBase) * 100) : 0
              return (
                <div key={idx} className="flex text-[9px]">
                  <span className="flex-1 truncate mr-1">{item.name}</span>
                  <span className="w-5 text-center">{item.quantity}</span>
                  <span className="w-[65px] text-right text-gray-600">
                    ${unitBase.toLocaleString()}
                  </span>
                  <span className="w-8 text-center text-gray-500">
                    {taxPct}%
                  </span>
                  <span className="w-14 text-right font-medium">
                    ${item.price.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>

          {lineSeparator}

          <div className="flex justify-between items-center py-2 bg-gray-100 px-2 -mx-3">
            <span className="font-bold text-sm uppercase">Total a Pagar:</span>
            <span className="font-bold text-lg">${total.toLocaleString()}</span>
          </div>

          {lineSeparator}

          <div className="py-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold uppercase text-gray-700">Método de Pago:</span>
              <span className="font-bold">{getPaymentLabel(paymentMethod)}</span>
            </div>
            {customerName && (
              <div className="flex justify-between items-center text-[9px] mt-1">
                <span className="text-gray-600">Cliente:</span>
                <span>{customerName}</span>
              </div>
            )}
          </div>

          {lineSeparator}

          <div className="text-center pb-3">
            <div className="w-16 h-16 mx-auto bg-gray-200 flex items-center justify-center text-[7px] text-gray-400">
              [CÓDIGO QR]
            </div>
            <p className="text-[8px] mt-2 font-medium">GRACIAS POR SU PREFERENCIA</p>
            <p className="text-[7px] text-gray-500">Vuelva pronto</p>
            <p className="text-[6px] text-gray-400 mt-1">SAAS Inventory v1.0</p>
          </div>

          <div className="text-center">
            <p className="text-[7px] text-gray-400">
              Este ticket es su comprobante de compra.
              Conservelo para cambios y garantias.
            </p>
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