"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { getReturnsReport } from "@/actions/reports"

type ReturnsPageClientProps = {
  storeId: string
  initialReport: {
    saleReturns: { items: any[]; total: number; count: number }
    supplierReturns: { items: any[]; total: number; count: number }
    sales: { monthly: { totalRevenue: number; totalTransactions: number } }
  }
}

export function ReturnsClient({ storeId, initialReport }: ReturnsPageClientProps) {
  const [mounted, setMounted] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [report, setReport] = useState(initialReport)
  const [loading, setLoading] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFilter = async () => {
    setLoading(true)
    try {
      const filter: any = {}
      if (startDate) filter.startDate = startDate
      if (endDate) filter.endDate = endDate
      if (typeFilter !== "ALL") filter.type = typeFilter

      const result = await getReturnsReport(storeId, filter)
      setReport(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      const res = await fetch(`/api/returns/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.returns || [])
    } catch (error) {
      console.error(error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const percentage = report.sales.monthly.totalRevenue > 0
    ? ((report.saleReturns.total / report.sales.monthly.totalRevenue) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-destructive">DEVOLUCIONES</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Control de devoluciones de ventas y proveedores
          </p>
        </div>
        <Link href="/reports" className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors">
          VOLVER A REPORTES
        </Link>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 mb-6 h-auto">
          <TabsTrigger 
            value="reports" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-6 py-3 uppercase tracking-widest text-xs font-bold"
          >
            REPORTES
          </TabsTrigger>
          <TabsTrigger 
            value="search" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-6 py-3 uppercase tracking-widest text-xs font-bold"
          >
            BUSCADOR DE DEVOLUCIONES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6 mt-0">
          {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="text-[10px] uppercase">FECHA DESDE</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-40 rounded-none"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase">FECHA HASTA</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-40 rounded-none"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase">TIPO</Label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 w-40 bg-card border border-border px-2 rounded-none text-xs uppercase"
          >
            <option value="ALL">TODOS</option>
            <option value="SALES">VENTAS</option>
            <option value="SUPPLIERS">PROVEEDORES</option>
          </select>
        </div>
        <Button
          onClick={handleFilter}
          disabled={loading}
          className="h-9 rounded-none uppercase tracking-widest font-bold"
        >
          {loading ? "FILTRANDO..." : "FILTRAR"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-none border border-destructive/30 bg-destructive/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-destructive">
              DEVOLUCIONES VENTAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">
              ${report.saleReturns.total.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">
              {report.saleReturns.count} devoluciones
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-orange-500/30 bg-orange-500/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
              DEVOLUCIONES PROVEEDORES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-orange-500">
              ${report.supplierReturns.total.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">
              {report.supplierReturns.count} devoluciones
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              VENTAS TOTALES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              ${report.sales.monthly.totalRevenue.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">
              {report.sales.monthly.totalTransactions} ventas
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              % DEVOLUCIONES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {percentage}%
            </div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">
              Sobre ventas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(typeFilter === "ALL" || typeFilter === "SALES") && (
          <Card className="rounded-none border border-destructive/30 bg-card/30 shadow-none">
            <CardHeader className="border-b border-destructive/20 pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-destructive">
                DEVOLUCIONES DE VENTAS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-destructive/5">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase text-destructive/70">ID</TableHead>
                    <TableHead className="text-[10px] uppercase text-destructive/70">CLIENTE</TableHead>
                    <TableHead className="text-[10px] uppercase text-destructive/70">MONTO</TableHead>
                    <TableHead className="text-[10px] uppercase text-destructive/70">MOTIVO</TableHead>
                    <TableHead className="text-[10px] uppercase text-destructive/70">FECHA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-mono text-xs">
                  {report.saleReturns.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center uppercase tracking-widest text-muted-foreground/50">
                        Sin devoluciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.saleReturns.items.slice(0, 20).map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-destructive/5">
                        <TableCell className="font-bold">#{sale.id.slice(-4)}</TableCell>
                        <TableCell>{sale.customer?.name || "—"}</TableCell>
                        <TableCell className="font-bold text-destructive">-${Math.abs(sale.total).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{sale.returnReason || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {mounted ? new Date(sale.createdAt).toLocaleDateString("es-CO") : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {(typeFilter === "ALL" || typeFilter === "SUPPLIERS") && (
          <Card className="rounded-none border border-orange-500/30 bg-card/30 shadow-none">
            <CardHeader className="border-b border-orange-500/20 pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-orange-500">
                DEVOLUCIONES A PROVEEDORES
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-orange-500/5">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase text-orange-500/70">ID</TableHead>
                    <TableHead className="text-[10px] uppercase text-orange-500/70">PROVEEDOR</TableHead>
                    <TableHead className="text-[10px] uppercase text-orange-500/70">MONTO</TableHead>
                    <TableHead className="text-[10px] uppercase text-orange-500/70">MOTIVO</TableHead>
                    <TableHead className="text-[10px] uppercase text-orange-500/70">FECHA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-mono text-xs">
                  {report.supplierReturns.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center uppercase tracking-widest text-muted-foreground/50">
                        Sin devoluciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.supplierReturns.items.slice(0, 20).map((purchase) => (
                      <TableRow key={purchase.id} className="hover:bg-orange-500/5">
                        <TableCell className="font-bold">#{purchase.id.slice(-4)}</TableCell>
                        <TableCell>{purchase.supplier?.name || "—"}</TableCell>
                        <TableCell className="font-bold text-orange-500">-${Math.abs(purchase.total).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{purchase.returnReason || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {mounted ? new Date(purchase.createdAt).toLocaleDateString("es-CO") : "—"}
                        </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-0 space-y-6">
          <Card className="rounded-none border border-border bg-card/30 shadow-none">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">
                BUSCAR DEVOLUCIONES
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="BUSCAR POR ID, CLIENTE O PRODUCTO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-10 rounded-none"
                />
                <Button 
                  onClick={handleSearch}
                 disabled={searching}
                  className="h-10 rounded-none uppercase font-bold"
                >
                  {searching ? "BUSCANDO..." : "BUSCAR"}
                </Button>
              </div>
              
              {searchResults.length > 0 ? (
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase">TIPO</TableHead>
                      <TableHead className="text-[10px] uppercase">ID</TableHead>
                      <TableHead className="text-[10px] uppercase">CLIENTE/PROVEEDOR</TableHead>
                      <TableHead className="text-[10px] uppercase">MONTO</TableHead>
                      <TableHead className="text-[10px] uppercase">MOTIVO</TableHead>
                      <TableHead className="text-[10px] uppercase">FECHA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-mono text-xs">
                    {searchResults.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold">{r.type}</TableCell>
                        <TableCell>#{r.id.slice(-4)}</TableCell>
                        <TableCell>{r.customerName || r.supplierName || "—"}</TableCell>
                        <TableCell className="font-bold">${Math.abs(r.total).toFixed(2)}</TableCell>
                        <TableCell>{r.returnReason || "—"}</TableCell>
                        <TableCell>{mounted ? new Date(r.createdAt).toLocaleDateString("es-CO") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : searchQuery && !searching ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No se encontraron devoluciones.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Ingresa un término de búsqueda para encontrar devoluciones.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}