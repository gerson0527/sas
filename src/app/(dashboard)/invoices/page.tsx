import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getInvoicesReport } from "@/actions/reports"
import { InvoicesClient } from "@/components/invoices/InvoicesClient"
import Link from "next/link"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

export default async function InvoicesPage() {
  const session = await auth()
  const userStore = await prisma.storeUser.findFirst({
    where: { userId: session?.user?.id },
    select: { storeId: true }
  })
  const storeId = userStore?.storeId
  if (!storeId) return null

  await requirePermission(storeId, "view_invoices")

  const [invoicesData, customers] = await Promise.all([
    getInvoicesReport(storeId),
    prisma.customer.findMany({
      where: { storeId },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">FACTURAS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Gestión de facturas y facturación
          </p>
        </div>
        <Link href="/reports" className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors">
          VOLVER A REPORTES
        </Link>
      </div>

      <InvoicesClient
        initialData={invoicesData}
        customers={customers}
        storeId={storeId}
      />
    </div>
  )
}