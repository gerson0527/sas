"use client"

import { useState, useMemo, useEffect } from "react"
import { getInvoicesReport } from "@/actions/reports"
import { sendSaleToPlemsi, checkPlemsiStatus } from "@/actions/plemsi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/Pagination"

type Invoice = {
  id: string
  invoiceNumber: string | null
  total: number
  paymentType: string
  paymentStatus: string
  createdAt: Date | string
  user: { name: string | null }
  customer: { name: string | null; document: string | null } | null
  items: { product: { name: string; sku: string | null }; quantity: number; price: number }[]
  invoiceStatus: string | null
  plemsiId: string | null
  dianCufe: string | null
  dianQrUrl: string | null
}

type InvoicesClientProps = {
  initialData: {
    invoices: Invoice[]
    totals: { subtotal: number; iva: number; total: number }
    byPaymentType: Record<string, number>
    byStatus: Record<string, number>
    count: number
  }
  customers: { id: string; name: string }[]
  storeId: string
}

export function InvoicesClient({ initialData, customers, storeId }: InvoicesClientProps) {
  const [mounted, setMounted] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("ALL")
  const [paymentType, setPaymentType] = useState("ALL")
  const [customerId, setCustomerId] = useState("")
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    setMounted(true)
    setInvoices(initialData.invoices as Invoice[])
  }, [initialData.invoices])

  const handleSearch = async () => {
    try {
      setLoading(true)
      const filter: Record<string, any> = {}

      if (startDate) {
        filter.startDate = startDate
      }
      if (endDate) {
        filter.endDate = endDate
      }
      if (status !== "ALL") filter.status = status
      if (paymentType !== "ALL") filter.paymentType = paymentType
      if (customerId) filter.customerId = customerId

      const result = await getInvoicesReport(storeId, filter)
      setInvoices(result.invoices)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!mounted) return
    const headers = ["FECHA", "ID", "CLIENTE", "METODO", "ESTADO", "SUBTOTAL", "IVA", "TOTAL"]
    const rows = invoices.map(inv => [
      new Date(inv.createdAt).toLocaleString("es-CO"),
      inv.id,
      inv.customer?.name || "CLIENTE MOSTRADOR",
      inv.paymentType,
      inv.paymentStatus,
      (inv.total / 1.19).toFixed(2),
      (inv.total * 0.19 / 1.19).toFixed(2),
      inv.total.toFixed(2)
    ])

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `facturas_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowDetail(true)
  }

  const totals = useMemo(() => {
    return invoices.reduce((acc, inv) => ({
      subtotal: acc.subtotal + (inv.total / 1.19),
      iva: acc.iva + (inv.total * 0.19 / 1.19),
      total: acc.total + inv.total
    }), { subtotal: 0, iva: 0, total: 0 })
  }, [invoices])

  const totalPages = Math.ceil(invoices.length / pageSize)
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return invoices.slice(start, start + pageSize)
  }, [invoices, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [invoices.length])

  const handleSendToPlemsi = async (invoiceId: string) => {
    try {
      setLoading(true)
      const result = await sendSaleToPlemsi(invoiceId)
      if (result.success) {
        setInvoices(prev => prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, invoiceStatus: "SENT", plemsiId: result.plemsiId || null }
            : inv
        ))
      }
      alert(result.message)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async (invoiceId: string) => {
    try {
      setLoading(true)
      const result = await checkPlemsiStatus(invoiceId)
      if (result.success) {
        setInvoices(prev => prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, invoiceStatus: result.status || inv.invoiceStatus }
            : inv
        ))
      }
      alert(result.message)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
        </div>
        <Button
          onClick={handleExport}
          className="rounded-none uppercase tracking-widest font-bold"
        >
          EXPORTAR CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              TOTAL FACTURADO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              ${totals.total.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">
              {invoices.length} facturas
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              SUBTOTAL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground">
              ${totals.subtotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              IVA (19%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-foreground">
              ${totals.iva.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-destructive/30 bg-destructive/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-destructive">
              PENDIENTES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">
              {invoices.filter(i => i.paymentStatus === "PENDING").length}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">
              por cobrar
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="border border-border p-4 rounded-none bg-card/30">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <Label className="text-[10px] uppercase">FECHA DESDE</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-none"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase">FECHA HASTA</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-none"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase">ESTADO</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs"
            >
              <option value="ALL">TODOS</option>
              <option value="PAID">PAGADA</option>
              <option value="PENDING">PENDIENTE</option>
            </select>
          </div>
          <div>
            <Label className="text-[10px] uppercase">METODO</Label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs"
            >
              <option value="ALL">TODOS</option>
              <option value="CASH">EFECTIVO</option>
              <option value="CARD">TARJETA</option>
              <option value="TRANSFER">TRANSFERENCIA</option>
              <option value="NEQUI">NEQUI</option>
            </select>
          </div>
          <div>
            <Label className="text-[10px] uppercase">CLIENTE</Label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs"
            >
              <option value="">TODOS</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-9 w-full rounded-none uppercase font-bold"
            >
              {loading ? "..." : "FILTRAR"}
            </Button>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs uppercase">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-bold">#</th>
                <th className="p-3 text-left font-bold">FACTURA</th>
                <th className="p-3 text-left font-bold">FECHA</th>
                <th className="p-3 text-left font-bold">CLIENTE</th>
                <th className="p-3 text-left font-bold">METODO</th>
                <th className="p-3 text-left font-bold">PAGO</th>
                <th className="p-3 text-left font-bold">DIAN</th>
                <th className="p-3 text-right font-bold">SUBTOTAL</th>
                <th className="p-3 text-right font-bold">IVA</th>
                <th className="p-3 text-right font-bold">TOTAL</th>
                <th className="p-3 text-left font-bold">CAJERO</th>
                <th className="p-3 text-center font-bold">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="h-32 text-center text-muted-foreground/50 uppercase">
                    Sin facturas
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv, idx) => (
                  <tr key={inv.id} className="border-t border-border hover:bg-primary/5">
                    <td className="p-3 font-bold">{((currentPage - 1) * pageSize) + idx + 1}</td>
                    <td className="p-3 font-bold text-primary">{inv.invoiceNumber || "#" + inv.id.slice(-6)}</td>
                    <td className="p-3">
                      {mounted ? new Date(inv.createdAt).toLocaleDateString("es-CO") : "—"}
                    </td>
                    <td className="p-3">
                      <div>{inv.customer?.name || "CLIENTE MOSTRADOR"}</div>
                      <div className="text-[9px] text-muted-foreground">{inv.customer?.document || "—"}</div>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 ${
                        inv.paymentType === "CASH" ? "bg-green-500/10 text-green-500" :
                        inv.paymentType === "CARD" ? "bg-blue-500/10 text-blue-500" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {inv.paymentType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 ${
                        inv.paymentStatus === "PAID" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                      }`}>
                        {inv.paymentStatus === "PAID" ? "PAGADA" : "PENDIENTE"}
                      </span>
                    </td>
                    <td className="p-3">
                      {!inv.invoiceStatus ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendToPlemsi(inv.id)}
                          disabled={loading}
                          className="h-6 rounded-none uppercase text-[9px] bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          ENVIAR
                        </Button>
                      ) : inv.invoiceStatus === "SENT" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckStatus(inv.id)}
                          disabled={loading}
                          className="h-6 rounded-none uppercase text-[9px] bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                        >
                          VERIFICAR
                        </Button>
                      ) : inv.invoiceStatus === "ACCEPTED" ? (
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">✓</span>
                          <span className="text-[9px] text-green-500">ACEPTADA</span>
                        </div>
                      ) : inv.invoiceStatus === "REJECTED" ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-destructive">✗ RECHAZADA</span>
                          <span className="text-[8px] text-muted-foreground truncate max-w-[80px]">{inv.invoiceStatus}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">{inv.invoiceStatus}</span>
                      )}
                    </td>
                    <td className="p-3 text-right">${(inv.total / 1.19).toFixed(2)}</td>
                    <td className="p-3 text-right">${(inv.total * 0.19 / 1.19).toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-primary">${inv.total.toFixed(2)}</td>
                    <td className="p-3 text-muted-foreground">{inv.user?.name || "—"}</td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(inv)}
                        className="h-7 rounded-none uppercase text-[10px]"
                      >
                        VER
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {showDetail && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetail(false)}>
          <div className="bg-background border border-border p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold uppercase text-primary mb-4">FACTURA #{selectedInvoice.id.slice(-6)}</h2>
            
            <div className="space-y-2 text-xs uppercase mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span>{new Date(selectedInvoice.createdAt).toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{selectedInvoice.customer?.name || "CLIENTE MOSTRADOR"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documento:</span>
                <span>{selectedInvoice.customer?.document || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método:</span>
                <span>{selectedInvoice.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span>{selectedInvoice.paymentStatus}</span>
              </div>
            </div>

            <div className="border-t border-b border-border py-2 mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1">PRODUCTO</th>
                    <th className="text-center py-1">CANT</th>
                    <th className="text-right py-1">PRECIO</th>
                    <th className="text-right py-1">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.product.name}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">${item.price.toFixed(2)}</td>
                      <td className="text-right font-bold">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs uppercase">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>${(selectedInvoice.total / 1.19).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (19%):</span>
                <span>${(selectedInvoice.total * 0.19 / 1.19).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>TOTAL:</span>
                <span className="text-primary">${selectedInvoice.total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={() => setShowDetail(false)}
              className="w-full mt-4 rounded-none uppercase font-bold"
            >
              CERRAR
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}