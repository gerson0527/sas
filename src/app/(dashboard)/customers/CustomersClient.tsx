"use client"

import { useState, useMemo, useEffect } from "react"
import { getCustomers, getCustomerWithHistory, registerPayment, getCustomerStats, bulkCreateCustomers } from "@/actions/customers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import CustomerForm from "@/components/forms/CustomerForm"
import CustomerActions from "@/components/customers/CustomerActions"
import { alert } from "@/lib/alert"
import { Pagination } from "@/components/ui/Pagination"
import { BulkImportDialog } from "@/components/shared/BulkImportDialog"

type Customer = {
  id: string
  name: string
  document: string | null
  phone: string | null
  address: string | null
  email: string | null
  creditLimit: number
  balance: number
}

type Sale = {
  id: string
  total: number
  paymentStatus: string
  createdAt: Date
  user: { name: string | null }
  items: { product: { name: string }, quantity: number, price: number }[]
}

type Payment = {
  id: string
  amount: number
  notes: string | null
  createdAt: Date
  user: { name: string | null }
}

type CustomerHistory = Customer & {
  sales: Sale[]
  payments: Payment[]
}

type Stats = {
  totalCustomers: number
  withDebt: number
  totalDebt: number
  overdue30: number
}

export default function CustomersClient({ 
  storeId, 
  initialCustomers, 
  initialStats 
}: { 
  storeId: string
  initialCustomers: Customer[]
  initialStats: Stats
}) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [search, setSearch] = useState("")
  const [withDebtOnly, setWithDebtOnly] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHistory | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const totalPages = Math.ceil(customers.length / pageSize)
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return customers.slice(start, start + pageSize)
  }, [customers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [customers.length])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const results = await getCustomers(storeId, search, withDebtOnly)
      setCustomers(results)
    } catch (err) {
      alert.error("Error en búsqueda", "No se pudieron cargar los clientes.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (customerId: string) => {
    setLoading(true)
    try {
      const data = await getCustomerWithHistory(customerId)
      setSelectedCustomer(data)
      setShowHistory(true)
    } catch (err) {
      alert.error("Error cargando historial")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterPayment = async (customerId: string, amount: number) => {
    if (!selectedCustomer) return
    const formData = new FormData()
    formData.set("amount", String(amount))
    formData.set("notes", "Pago registrado")
    try {
      await registerPayment(customerId, storeId, formData)
      alert.success("Pago registrado", "El abono fue guardado correctamente.")
      const updated = await getCustomerWithHistory(customerId)
      setSelectedCustomer(updated)
      handleSearch()
    } catch (err: any) {
      alert.error("Error al cargar detalles", err.message)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await getCustomerWithHistory(customerId) // This needs a delete function - skipping for now
    } catch (err) {
      // 
    }
  }

  return (
    <div className="flex flex-col h-full bg-background p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-border bg-card/30 p-3 rounded-none">
          <p className="text-[10px] uppercase text-muted-foreground">TOTAL CLIENTES</p>
          <p className="text-xl font-black">{initialStats.totalCustomers}</p>
        </div>
        <div className="border border-border bg-card/30 p-3 rounded-none">
          <p className="text-[10px] uppercase text-muted-foreground">CON DEUDA</p>
          <p className="text-xl font-black text-destructive">{initialStats.withDebt}</p>
        </div>
        <div className="border border-border bg-card/30 p-3 rounded-none">
          <p className="text-[10px] uppercase text-muted-foreground">DEUDA TOTAL</p>
          <p className="text-xl font-black text-destructive">${initialStats.totalDebt.toFixed(2)}</p>
        </div>
        <div className="border border-destructive/30 bg-destructive/5 p-3 rounded-none">
          <p className="text-[10px] uppercase text-destructive">VENCIDOS (+30D)</p>
          <p className="text-xl font-black text-destructive">{initialStats.overdue30}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold font-mono uppercase tracking-widest text-primary">
          DIRECTORIO DE CLIENTES
        </h1>
        <div className="flex gap-2">
          <BulkImportDialog 
            storeId={storeId} 
            entityName="CLIENTES" 
            onImport={async (storeId, data) => {
              await bulkCreateCustomers(storeId, data)
              // Refresh table after import
              const results = await getCustomers(storeId, search, withDebtOnly)
              setCustomers(results)
            }} 
          />
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap h-9 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-primary bg-primary text-primary-foreground hover:bg-primary/90">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              AÑADIR CLIENTE
            </DialogTrigger>
            <DialogContent className="rounded-none border-border bg-background sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-mono uppercase tracking-widest text-sm text-primary">NUEVO CLIENTE</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <CustomerForm storeId={storeId} onSuccess={() => { setShowNew(false); handleSearch() }} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input 
          placeholder="BUSCAR POR NOMBRE, DOCUMENTO O TELÉFONO..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          className="flex-1 h-10 bg-card border-border rounded-none uppercase"
        />
        <Button 
          onClick={handleSearch}
          disabled={loading}
          className="rounded-none uppercase tracking-widest font-bold"
        >
          BUSCAR
        </Button>
        <Button 
          variant={withDebtOnly ? "default" : "outline"}
          onClick={() => { setWithDebtOnly(!withDebtOnly); handleSearch() }}
          className="rounded-none uppercase tracking-widest font-bold"
        >
          {withDebtOnly ? "CON DEUDA" : "TODOS"}
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border bg-card/30 rounded-none overflow-x-auto">
        <table className="w-full text-left text-sm font-mono">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border tracking-widest">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">NOMBRE</th>
              <th className="px-4 py-3 font-medium">CONTACTO</th>
              <th className="px-4 py-3 font-medium text-right">LÍMITE</th>
              <th className="px-4 py-3 font-medium text-right">DEUDA</th>
              <th className="px-4 py-3 font-medium text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedCustomers.map((c, idx) => (
              <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 text-muted-foreground text-xs">{(currentPage - 1) * pageSize + idx + 1}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleViewDetails(c.id)} className="text-xs font-bold uppercase hover:text-primary text-left">
                    {c.name}
                  </button>
                  <p className="text-[9px] text-muted-foreground">{c.document || "Sin documento"}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <p>{c.phone || "N/A"}</p>
                </td>
                <td className="px-4 py-3 text-xs text-right">${c.creditLimit.toFixed(2)}</td>
                <td className={`px-4 py-3 text-xs text-right font-bold ${c.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  ${c.balance.toFixed(2)}
                </td>
                <td className="px-4 py-3 flex justify-center gap-2">
                  <button 
                    onClick={() => handleViewDetails(c.id)}
                    className="text-[9px] uppercase border border-primary/50 bg-primary/10 hover:bg-primary/20 px-2 py-1 text-primary rounded-none"
                  >
                    VER
                  </button>
                  <CustomerActions customer={c} storeId={storeId} onPayment={() => handleSearch()} />
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs uppercase tracking-widest">
                  NO HAY CLIENTES REGISTRADOS.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Customer History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="rounded-none border-border bg-background max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-primary">
              {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              {/* Balance */}
              <div className={`border p-3 rounded-none ${selectedCustomer.balance > 0 ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-muted-foreground">DEUDA ACTUAL</span>
                  <span className={`text-xl font-black ${selectedCustomer.balance > 0 ? "text-destructive" : "text-primary"}`}>
                    ${selectedCustomer.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border border-border p-3 rounded-none">
                <p className="text-[10px] uppercase text-muted-foreground mb-1">CONTACTO</p>
                <p className="text-xs">{selectedCustomer.phone || "N/A"}</p>
                <p className="text-xs">{selectedCustomer.email || "Sin email"}</p>
                <p className="text-xs">{selectedCustomer.address || "Sin dirección"}</p>
              </div>

              {/* Quick Payment */}
              {selectedCustomer.balance > 0 && (
                <div className="border border-border p-3 rounded-none">
                  <p className="text-[10px] uppercase text-muted-foreground mb-2">REGISTRAR PAGO</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleRegisterPayment(selectedCustomer.id, selectedCustomer.balance)} className="flex-1 rounded-none uppercase font-bold">
                      PAGAR TOTAL
                    </Button>
                  </div>
                </div>
              )}

              {/* Sales History */}
              <div>
                <p className="text-[10px] uppercase text-muted-foreground mb-2">ÚLTIMAS COMPRAS ({selectedCustomer.sales.length})</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedCustomer.sales.map(sale => (
                    <div key={sale.id} className="flex justify-between text-xs border-b border-border/50 py-1">
                      <div>
                        <span className="font-bold">{new Date(sale.createdAt).toLocaleDateString()}</span>
                        <span className="text-muted-foreground ml-2">
                          {sale.items.map(i => i.product.name).slice(0, 2).join(", ")}
                          {sale.items.length > 2 && ` +${sale.items.length - 2}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={sale.paymentStatus === "PENDING" ? "text-destructive" : "text-primary"}>
                          ${sale.total.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase">
                          {sale.paymentStatus === "PENDING" ? "PENDIENTE" : "PAGADO"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {selectedCustomer.sales.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sin compras</p>
                  )}
                </div>
              </div>

              {/* Payments History */}
              <div>
                <p className="text-[10px] uppercase text-muted-foreground mb-2">ÚLTIMOS PAGOS ({selectedCustomer.payments.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedCustomer.payments.map(p => (
                    <div key={p.id} className="flex justify-between text-xs border-b border-border/50 py-1">
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      <span className="text-primary font-bold">+${p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedCustomer.payments.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sin pagos registrados</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}