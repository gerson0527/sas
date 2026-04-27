"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getReportData } from "@/actions/reports"

type ReportsClientProps = {
  storeId: string
  initialData: {
    today: { totalRevenue: number; totalTransactions: number }
    weekly: { totalRevenue: number; totalTransactions: number }
    monthly: { topProducts: any[]; byUser: Record<string, any>; byDay: Record<string, any>; totalRevenue: number; totalTransactions: number; byPaymentType: Record<string, number>; profitMargin: number }
  }
}

type ReportData = {
  today: { totalRevenue: number; totalTransactions: number }
  weekly: { totalRevenue: number; totalTransactions: number }
  monthly: { topProducts: any[]; byUser: Record<string, any>; byDay: Record<string, any>; totalRevenue: number; totalTransactions: number; byPaymentType: Record<string, number>; profitMargin: number }
}

export function ReportsClient({ storeId, initialData }: ReportsClientProps) {
  const [mounted, setMounted] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [report, setReport] = useState<ReportData>(initialData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFilter = async () => {
    setLoading(true)
    try {
      const filter: any = {}
      if (startDate) filter.startDate = startDate
      if (endDate) filter.endDate = endDate

      const result = await getReportData(storeId, filter)
      setReport({
        today: result.today,
        weekly: result.weekly,
        monthly: result.monthly
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const { today, weekly, monthly } = report
  const topProducts = monthly.topProducts.slice(0, 10)
  const topUsers = Object.entries(monthly.byUser)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
  const topDays = Object.entries(monthly.byDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">REPORTES Y ANALYTICS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Análisis de ventas y rendimiento
          </p>
        </div>
        <Link href="/finance" className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors">
          VOLVER A FINANZAS
        </Link>
      </div>

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
        <Button
          onClick={handleFilter}
          disabled={loading}
          className="h-9 rounded-none uppercase tracking-widest font-bold"
        >
          {loading ? "FILTRANDO..." : "FILTRAR"}
        </Button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">HOY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">${today.totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">{today.totalTransactions} transacciones</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ESTA SEMANA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">${weekly.totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">{weekly.totalTransactions} transacciones</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border border-primary/30 bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">PERIODO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">${monthly.totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">{monthly.totalTransactions} transacciones</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">PRODUCTOS TOP ({topProducts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topProducts.length === 0 ? (
                <div className="p-4 text-center text-[10px] uppercase text-muted-foreground/50">Sin datos</div>
              ) : topProducts.map((p: any, i: number) => (
                <div key={p.productId} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-5 w-5 rounded-none flex items-center justify-center text-[9px] font-bold ${i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase">{p.productName}</p>
                      <p className="text-[9px] text-muted-foreground">{p.count} uds</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary">${p.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">POR CAJERO</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topUsers.length === 0 ? (
                <div className="p-4 text-center text-[10px] uppercase text-muted-foreground/50">Sin datos</div>
              ) : topUsers.map(([name, data]: [string, any]) => (
                <div key={name} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase">{name}</p>
                    <p className="text-[9px] text-muted-foreground">{data.count} ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary">${data.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">FLUJO DIARIO</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topDays.length === 0 ? (
                <div className="p-4 text-center text-[10px] uppercase text-muted-foreground/50">Sin datos</div>
              ) : topDays.map(([day, data]: [string, any]) => (
                <div key={day} className="p-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">{day}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-muted-foreground">{data.count} ventas</span>
                    <span className="text-[10px] font-black text-primary">${data.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none border border-border bg-card/30 shadow-none">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">MÉTODO DE PAGO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(monthly.byPaymentType).map(([method, amount]) => (
              <div key={method} className="border border-border p-3 rounded-none">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{method}</p>
                <p className="text-lg font-black text-foreground">${(amount as number).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border border-primary/30 bg-primary/5 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">MARGEN DE GANANCIA ESTIMADO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-primary">${monthly.profitMargin.toFixed(2)}</div>
          <p className="text-[10px] text-muted-foreground uppercase mt-1">Basado en costos registrados de productos</p>
        </CardContent>
      </Card>
    </div>
  )
}