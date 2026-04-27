import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFinanceSummary, getExpenses } from "@/actions/finance"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import ExpenseForm from "@/components/forms/ExpenseForm"
import FinanceActions from "@/components/finance/FinanceActions"
import { FinanceClient } from "@/components/finance/FinanceClient"
import Link from "next/link"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

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

export default async function FinancePage() {
  const session = await auth()
  const userStore = await prisma.storeUser.findFirst({
    where: { userId: session?.user?.id },
    select: { storeId: true }
  })
  const storeId = userStore?.storeId
  if (!storeId) return null

  await requirePermission(storeId, "manage_expenses")

  const summary = await getFinanceSummary(storeId)
  const expenses = await getExpenses(storeId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">FINANZAS / CAJA</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Fecha: {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports" className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors">
            VER REPORTES
          </Link>
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-primary bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
              REGISTRAR GASTO
            </DialogTrigger>
            <DialogContent className="rounded-none border-border bg-background sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="uppercase tracking-widest font-bold text-sm text-primary">REGISTRAR GASTO</DialogTitle>
              </DialogHeader>
              <ExpenseForm storeId={storeId} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <FinanceClient storeId={storeId} initialSummary={summary} />

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">GASTOS REGISTRADOS</h2>
        </div>
        <div className="divide-y divide-border">
          {expenses.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/50">No hay gastos registrados</p>
            </div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase">{exp.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] uppercase tracking-widest bg-muted/50 px-2 py-0.5">{EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}</span>
                    <span className="text-[9px] text-muted-foreground">{exp.user?.name}</span>
                    <span className="text-[9px] text-muted-foreground">{exp.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-destructive">${exp.amount.toFixed(2)}</span>
                  <FinanceActions expenseId={exp.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}