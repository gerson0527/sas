"use client"

import { useState, useMemo, useEffect } from "react"
import { createSale, openCashShift } from "@/actions/sales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CloseShiftDialog } from "./CloseShiftDialog"
import { ReturnDialog } from "./ReturnDialog"
import { TicketDialog } from "./TicketDialog"
import { Pagination } from "@/components/ui/Pagination"
import { Shift, Product, Customer, Category } from "./types"
import { 
  Search, 
  X, 
  Zap, 
  CreditCard, 
  Banknote, 
  Wallet, 
  Smartphone,
  CircleDollarSign,
  Package,
  Lock,
  Unlock
} from "lucide-react"

type CartItem = Product & { quantity: number }

export function POSClient({ products, storeId, customers, categories, currentShift, registers: initialRegisters = [] }: { 
  products: Product[], 
  storeId: string, 
  customers: Customer[],
  categories: Category[],
  currentShift: Shift | null,
  registers?: { id: string; name: string }[]
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("TODOS")
  const [isProcessing, setIsProcessing] = useState(false)
  const [shift, setShift] = useState<Shift | null>(currentShift)
  const [showOpenShift, setShowOpenShift] = useState(!currentShift || (currentShift && currentShift.status === "CLOSED"))
  const [startingCash, setStartingCash] = useState("100000")
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [registers, setRegisters] = useState<{ id: string; name: string }[]>(initialRegisters)
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>("")
  
  const [paymentMethod, setPaymentMethod] = useState<string[]>(["CASH"])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [showTicket, setShowTicket] = useState(false)
  const [lastSale, setLastSale] = useState<{
    id: string
    items: { name: string; quantity: number; price: number }[]
    total: number
  } | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    address: "",
    creditLimit: 0
  })

  const togglePaymentMethod = (method: string) => {
    if (method === "DEBT") {
      setPaymentMethod(prev => {
        if (prev.includes("DEBT")) return []
        return ["DEBT"]
      })
    } else {
      setPaymentMethod(prev => {
        if (prev.includes("DEBT")) return [method]
        if (prev.includes(method)) {
          return prev.filter(m => m !== method)
        }
        return [...prev, method]
      })
    }
  }

  const hasSales = shift?.salesBreakdown?.transactionCount ? shift.salesBreakdown.transactionCount > 0 : false
  const isPreviousDay = shift?.isPreviousDay || false
  const canClose = !isProcessing && (hasSales || (isPreviousDay && shift?.status !== "CLOSED"))

  const [productsPage, setProductsPage] = useState(1)
  const productsPerPage = 20

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.error("INGRESE NOMBRE DEL CLIENTE")
      return
    }
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newCustomer.name,
          document: newCustomer.document || null,
          email: newCustomer.email || null,
          phone: newCustomer.phone || null,
          address: newCustomer.address || null,
          creditLimit: newCustomer.creditLimit,
          storeId 
        })
      })
      const data = await res.json()
      if (data.id) {
        setSelectedCustomerId(data.id)
        toast.success("CLIENTE CREADO")
        setShowNewCustomerDialog(false)
        setNewCustomer({ name: "", document: "", email: "", phone: "", address: "", creditLimit: 0 })
        setCustomerSearch("")
      }
    } catch {
      toast.error("ERROR AL CREAR CLIENTE")
    }
  }

  const handleAmountChange = (method: string, value: number) => {
    setAmounts(prev => ({ ...prev, [method]: value }))
  }

  const [amounts, setAmounts] = useState<Record<string, number>>({})

  // Auto-select first register if only one exists and none selected
  useEffect(() => {
    if (registers.length === 1 && !selectedRegisterId) {
      setSelectedRegisterId(registers[0].id)
    }
  }, [registers, selectedRegisterId])

  const categoryOptions = [
    { id: "TODOS", name: "TODOS", parentId: null },
    ...categories.map((c: any) => ({ 
      id: c.id, 
      name: c.parentId ? `↳ ${c.name}` : c.name,
      parentId: c.parentId 
    }))
  ]

  const filteredProducts = useMemo(() => {
    let filtered = products
    if (selectedCategory !== "TODOS") {
      filtered = filtered.filter(p => p.categoryId === selectedCategory || (selectedCategory.startsWith("↳ ") && !p.categoryId))
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(lowerQuery) || (p.sku && p.sku.toLowerCase().includes(lowerQuery))
      )
    }
    return filtered
  }, [products, searchQuery, selectedCategory])

  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (productsPage - 1) * productsPerPage
    return filteredProducts.slice(start, start + productsPerPage)
  }, [filteredProducts, productsPage])

  useEffect(() => {
    setProductsPage(1)
  }, [searchQuery, selectedCategory])

  const subtotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart])
  const iva = subtotal * 0.19
  const total = subtotal + iva

  const handleOpenShift = async () => {
    try {
      setIsProcessing(true)
      const shiftData = await openCashShift(storeId, parseFloat(startingCash), selectedRegisterId || undefined)
      setShift(shiftData)
      setShowOpenShift(false)
      toast.success("CAJA APERTURADA")
    } catch (error: any) {
      toast.error(error.message || "ERROR AL ABRIR CAJA")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseShift = () => {
    if (!shift) return
    setShowCloseDialog(true)
  }

  const addToCart = (product: Product) => {
    if (!shift || shift.status === "CLOSED") {
      toast.error("ABRA LA CAJA PRIMERO")
      return
    }
    if (product.stock <= 0) {
      toast.error("AGOTADO")
      return
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning("STOCK INSUFICIENTE")
          return prev
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setSearchQuery("")
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta)
        if (newQty > item.stock) {
          toast.warning("MAXIMO STOCK ALCANZADO")
          return item
        }
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!shift || shift.status === "CLOSED") {
      toast.error("ABRA LA CAJA PRIMERO")
      return
    }
    
    const isDebt = paymentMethod.includes("DEBT")
    if (isDebt && !selectedCustomerId) {
      toast.error("SELECCIONE CLIENTE PARA FIADO")
      return
    }
    
    if (!isDebt && paymentMethod.length === 0) {
      toast.error("SELECCIONE MÉTODO DE PAGO")
      return
    }

    // Validate credit limit
    if (isDebt && selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId)
      const creditLimit = customer?.creditLimit || 0
      const currentBalance = customer?.balance || 0
      const availableCredit = creditLimit - currentBalance
      
      if (total > availableCredit) {
        toast.error(`CRÉDITO INSUFICIENTE. DISPONIBLE: $${availableCredit.toFixed(2)}`)
        return
      }
    }
    
    const totalPaid = Object.values(amounts).reduce((sum, val) => sum + val, 0)
    if (!isDebt && totalPaid < total) {
      toast.error("EL MONTO NO CUBRE EL TOTAL")
      return
    }
    
    try {
      setIsProcessing(true)
      const itemsPayload = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
      
      const status = isDebt ? "PENDING" : "PAID"
      await createSale(storeId, itemsPayload, selectedCustomerId || undefined, status, shift.id)
      
      setLastSale({
        id: "SALE" + Date.now(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: total
      })
      
setShowTicket(true)
      setCart([])
      setSelectedCustomerId("")
      setPaymentMethod(["CASH"])
      setAmounts({})
    } catch (error: any) {
      toast.error(error.message || "ERROR AL PROCESAR")
    } finally {
      setIsProcessing(false)
    }
  }

  if (showOpenShift || !shift) {
    const hasRegisters = registers.length > 0
    
    return (
      <div className="flex flex-1 h-full w-full bg-background text-foreground font-mono uppercase overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-4 border-destructive flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-black text-destructive mb-2">CAJA CERRADA</h1>
          <p className="text-[10px] text-muted-foreground mb-6 text-center max-w-xs">
            {!hasRegisters 
              ? "NO HAY CAJAS CONFIGURADAS. CONTACTE AL ADMINISTRADOR." 
              : "DEBE ABRIR LA CAJA PARA OPERAR."
            }
          </p>
          
          <div className="w-full max-w-[200px] space-y-3">
            {hasRegisters ? (
              <>
                <div>
                  <label className="text-[8px] text-muted-foreground block mb-1">CAJA ($)</label>
                  <select
                    value={selectedRegisterId}
                    onChange={(e) => setSelectedRegisterId(e.target.value)}
                    className="h-10 w-full bg-card border border-border text-center text-lg font-black rounded-none"
                  >
                    {registers.map(reg => (
                      <option key={reg.id} value={reg.id}>{reg.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] text-muted-foreground block mb-1">EFECTIVO BASE ($)</label>
                  <Input 
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    className="h-10 bg-card border-border rounded-none border border-border text-center text-lg font-black"
                  />
                </div>
                <Button 
                  onClick={handleOpenShift}
                  disabled={isProcessing}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm rounded-none"
                >
                  {isProcessing ? "ABRIENDO..." : "ABRIR CAJA"}
                </Button>
              </>
            ) : (
              <Button 
                disabled
                className="w-full h-12 bg-muted text-muted-foreground font-black text-sm rounded-none cursor-not-allowed"
              >
                SIN CAJAS
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-full w-full bg-background text-foreground font-mono overflow-hidden">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background pt-2 pb-2">
          <h1 className="text-xl font-black text-primary tracking-widest">OPERACIONES</h1>
          <div className="flex items-center gap-2 ">
            <ReturnDialog storeId={storeId} currentShift={shift} />
            <button 
              onClick={handleCloseShift}
              disabled={!canClose}
              className="text-[10px] border border-destructive/30 text-destructive px-3 py-2 hover:bg-destructive/10 transition-colors rounded-none disabled:opacity-30"
            >
              CERRAR CAJA
            </button>
            <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 px-3 py-2">
              <div className="w-2 h-2 bg-primary animate-pulse rounded-none" />
              {isPreviousDay && <span className="text-destructive">ANTERIOR</span>}
              CAJA #{shift.id.slice(-4)}
            </div>
          </div>
        </div>
        
        <Input 
          placeholder="BUSCAR PRODUCTO O ESCANEAR SKU..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 bg-card border-border rounded-none border border-border text-xs"
          autoFocus
        />

        <div className="flex gap-1 overflow-x-auto">
          {categoryOptions.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 text-[10px] font-bold border rounded-none whitespace-nowrap ${
                selectedCategory === cat.id 
                ? "bg-primary border-primary text-primary-foreground" 
                : "bg-card border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

<div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-0">
          {paginatedProducts.map(product => (
            <div 
              key={product.id}
              onClick={() => addToCart(product)}
              className="group relative bg-card border border-border hover:border-primary transition-all cursor-pointer flex flex-col p-1 rounded-none h-[140px] justify-between m-[1px]"
            >
              <div className="flex items-center justify-center">
                <CircleDollarSign className="w-4 h-4 text-border/50 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-center line-clamp-2 leading-tight">{product.name}</p>
                <p className="text-[14px] font-black text-center text-primary">${product.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        {totalProductPages > 1 && (
          <Pagination
            currentPage={productsPage}
            totalPages={totalProductPages}
            onPageChange={setProductsPage}
          />
        )}
      </div>

      <div className="w-[320px] sticky top-0 flex flex-col bg-card border-l border-border h-auto overflow-y-auto">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input 
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="CEDULA/NOMBRE - ENTER"
                className="w-full h-8 bg-background border border-border px-2 text-xs rounded-none uppercase"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customerSearch.trim()) {
                    e.preventDefault()
                    const found = customers.find(c => 
                      c.document === customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase())
                    )
                    if (found) {
                      setSelectedCustomerId(found.id)
                    } else {
                      setNewCustomer(prev => ({ ...prev, document: customerSearch }))
                      setShowNewCustomerDialog(true)
                    }
                  }
                }}
              />
            </div>
            {paymentMethod.includes("DEBT") && (
              <button 
                onClick={() => {
                  setNewCustomer(prev => ({ ...prev, document: customerSearch }))
                  setShowNewCustomerDialog(true)
                }}
                className="h-8 px-2 text-[10px] bg-primary text-primary-foreground rounded-none"
              >
                + NUEVO
              </button>
            )}
          </div>
          
          {selectedCustomerId && (
            <div className="flex items-center justify-between bg-primary/10 px-2 py-1 mt-2">
              <span className="text-[10px] font-bold">
                {customers.find(c => c.id === selectedCustomerId)?.name}
              </span>
              <button onClick={() => setSelectedCustomerId("")} className="text-[10px] text-destructive">
                CAMBIAR
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
              <Package className="w-6 h-6 mb-2" />
              <p className="text-[10px] font-bold">CARRITO VACÍO</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-background border-l-2 border-primary/50 p-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-bold truncate">{item.name}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-primary w-6 h-6 flex items-center justify-center border border-border text-xs font-bold">-</button>
                  <span className="text-[10px] font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-primary w-6 h-6 flex items-center justify-center border border-border text-xs font-bold">+</button>
                </div>
                <p className="text-[10px] font-black text-primary w-16 text-right">
                  ${(item.price * item.quantity).toLocaleString()}
                </p>
                <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border/50">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => togglePaymentMethod("CASH")}
              disabled={paymentMethod.includes("DEBT")}
              className={`h-10 text-[10px] flex items-center justify-center border rounded-none font-bold ${paymentMethod.includes("CASH") ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"} ${paymentMethod.includes("DEBT") ? "opacity-30" : ""}`}>
              EFECTIVO
            </button>
            <button onClick={() => togglePaymentMethod("NEQUI")}
              disabled={paymentMethod.includes("DEBT")}
              className={`h-10 text-[10px] flex items-center justify-center border rounded-none font-bold ${paymentMethod.includes("NEQUI") ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"} ${paymentMethod.includes("DEBT") ? "opacity-30" : ""}`}>
              NEQUI
            </button>
            <button onClick={() => togglePaymentMethod("CARD")}
              disabled={paymentMethod.includes("DEBT")}
              className={`h-10 text-[10px] flex items-center justify-center border rounded-none font-bold ${paymentMethod.includes("CARD") ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"} ${paymentMethod.includes("DEBT") ? "opacity-30" : ""}`}>
              TARJETA
            </button>
          </div>

          <button onClick={() => togglePaymentMethod("DEBT")}
            disabled={paymentMethod.length > 1}
            className={`w-full h-10 text-[10px] flex items-center justify-center border rounded-none font-bold mb-3 ${paymentMethod.includes("DEBT") ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"}`}>
            FIADO (CRÉDITO)
          </button>

          {paymentMethod.some(m => m !== "DEBT") && (
            <div className="space-y-2 mb-2">
              {paymentMethod.filter(m => m !== "DEBT").map(method => (
                <div key={method} className="flex items-center gap-2">
                  <span className="text-[10px] w-20 uppercase">{method === "CASH" ? "Efectivo" : method === "NEQUI" ? "NEQUI" : "Tarjeta"}:</span>
                  <input
                    type="number"
                    value={amounts[method] || ""}
                    onChange={(e) => handleAmountChange(method, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1 h-9 bg-background border border-border rounded-none px-2 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1 border-t border-border/50 pt-2 mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>SUBTOTAL:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>IVA (19%):</span>
              <span>${iva.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-primary">
              <span>TOTAL:</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full h-12 bg-primary text-primary-foreground font-black text-sm rounded-none"
          >
            {isProcessing ? "PROCESANDO..." : "COMPLETAR VENTA"}
          </Button>
        </div>
      </div>

      <CloseShiftDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        shift={shift}
        storeId={storeId}
      />

      <TicketDialog
        open={showTicket}
        onClose={() => setShowTicket(false)}
        items={lastSale?.items || []}
        subtotal={subtotal}
        iva={iva}
        total={total}
        paymentMethod={Array.isArray(paymentMethod) ? paymentMethod.join("+") : paymentMethod}
        customerName={selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : undefined}
        saleId={lastSale?.id}
      />

      {showNewCustomerDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border p-4 w-[400px] space-y-3">
            <h3 className="font-bold uppercase text-sm">NUEVO CLIENTE</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">DOCUMENTO*</label>
                <input
                  value={newCustomer.document}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, document: e.target.value }))}
                  placeholder="CEDULA/NIT"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none uppercase"
                />
              </div>
              
              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">NOMBRE*</label>
                <input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="NOMBRE COMPLETO"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none uppercase"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">EMAIL</label>
                <input
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="EMAIL"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none"
                />
              </div>
              
              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">TELÉFONO</label>
                <input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="3001234567"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none"
                />
              </div>
              
              <div className="col-span-2">
                <label className="text-[9px] text-muted-foreground block mb-1">DIRECCIÓN</label>
                <input
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="DIRECCIÓN"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none uppercase"
                />
              </div>
              
              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">LÍMITE CRÉDITO ($)</label>
                <input
                  type="number"
                  value={newCustomer.creditLimit || ""}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowNewCustomerDialog(false)}
                className="flex-1 h-10 border border-border text-xs rounded-none"
              >
                CANCELAR
              </Button>
              <Button
                onClick={handleCreateCustomer}
                disabled={!newCustomer.name}
                className="flex-1 h-10 bg-primary text-primary-foreground font-bold text-xs rounded-none"
              >
                CREAR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}