"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getFinanceSummary, getExpenses } from "@/actions/finance"

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  RENT: "Arriendo",
  UTILITIES: "Servicios",
  SUPPLIES: "Suministros",
  SERVICES: "Servicios Varios",
  PAYROLL: "Nómina",
  MAINTENANCE: "Mantenimiento",
  TRANSPORT: "Transporte",
  TAXES: "Impuestos",
  MARKETING: "Marketing",
  OTHER: "Otro",
}

type FinanceClientProps = {
  storeId: string
  initialSummary: {
    totalSales: number
    cashSales: number
    cardSales: number
    transferSales: number
    pendingSales: number
    totalExpenses: number
    startingCash: number
    profit: number
  }
}

export function FinanceClient({ storeId, initialSummary }: FinanceClientProps) {
  const [mounted, setMounted] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFilter = async () => {
    setLoading(true)
    try {
      const filter: any = { startDate, endDate }
      const result = await getFinanceSummary(storeId, filter)
      setSummary(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ventas Totales</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-primary">${summary.totalSales.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Efectivo</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-foreground">${summary.cashSales.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gastos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-destructive">${summary.totalExpenses.toFixed(2)}</div></CardContent>
        </Card>
        <Card className={`rounded-none border shadow-none ${summary.profit >= 0 ? "border-primary/30 bg-primary/5" : "border-destructive/50 bg-destructive/5"}`}>
          <CardHeader className="pb-2"><CardTitle className={`text-[10px] font-bold uppercase tracking-widest ${summary.profit >= 0 ? "text-primary" : "text-destructive"}`}>Ganancia Neta</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-black ${summary.profit >= 0 ? "text-primary" : "text-destructive"}`}>${summary.profit.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Base en Caja</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-black">${summary.startingCash.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tarjeta</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-black">${summary.cardSales.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transferencia</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-black">${summary.transferSales.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pendiente (Fiado)</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-black text-destructive">${summary.pendingSales.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gastos</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-black text-destructive">${summary.totalExpenses.toFixed(2)}</div></CardContent>
        </Card>
      </div>
    </div>
  )
}