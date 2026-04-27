import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FirstPasswordModal } from "@/components/auth/FirstPasswordModal"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isFirstTime: true }
  })

  // Fetch the user's primary store
  const userStore = await prisma.storeUser.findFirst({
    where: { userId: session.user.id },
    select: { storeId: true }
  })

  const storeId = userStore?.storeId
  if (!storeId) return null

  // Calculate beginning of today
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  // Fetch real data simultaneously for better performance
  const [
    totalRevenue,
    productsCount,
    salesToday,
    recentSales,
    customersCount,
    totalDebt,
    categoriesCount
  ] = await Promise.all([
    // 1. Total Revenue of the store
    prisma.sale.aggregate({
      where: { storeId },
      _sum: { total: true }
    }),
    // 2. Total unique products registered
    prisma.product.count({
      where: { storeId }
    }),
    // 3. Sales and transactions strictly today
    prisma.sale.aggregate({
      where: { storeId, createdAt: { gte: startOfDay } },
      _sum: { total: true },
      _count: { _all: true }
    }),
    // 4. Recent 5 sales for the table
    prisma.sale.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } }
      }
    }),
    // 5. Total customers
    prisma.customer.count({
      where: { storeId }
    }),
    // 6. Total debt from customers
    prisma.customer.aggregate({
      where: { storeId, balance: { gt: 0 } },
      _sum: { balance: true }
    }),
    // 7. Total categories
prisma.category.count({
      where: { storeId }
    })
  ])

// Formatting revenue safely
  const revValue = totalRevenue._sum.total || 0
  const salesTodayTotal = salesToday._sum.total || 0
  const transactionsToday = salesToday._count._all || 0
  const debtValue = totalDebt._sum.balance || 0
  const avgTicket = transactionsToday > 0 ? salesTodayTotal / transactionsToday : 0
  
  // Custom raw query since Prisma doesn't easily let us compare two columns natively in count yet
  const rawLowStockCount = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT count(*) FROM "Product" WHERE "storeId" = ${storeId} AND "stock" <= "minStock";
  `
  const lowStock = Number(rawLowStockCount[0]?.count || 0)

  return (
    <>
      <div className="grid flex-1 items-start gap-4 md:gap-6 max-w-[1600px] mx-auto w-full">
      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ingresos Totales</CardTitle>
            <div className="h-6 w-6 rounded-none border border-primary/20 bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" className="h-3 w-3 text-primary"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">${revValue.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">Ganancias de por vida</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ventas de Hoy</CardTitle>
            <div className="h-6 w-6 rounded-none border border-primary/20 bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" className="h-3 w-3 text-primary"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">${salesTodayTotal.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">{transactionsToday} transacciones hoy</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ticket Promedio</CardTitle>
            <div className="h-6 w-6 rounded-none border border-primary/20 bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" className="h-3 w-3 text-primary"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2m0 8v2"/></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">${avgTicket.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">Por transacción</p>
          </CardContent>
        </Card>

        <Card className={`rounded-none border shadow-none ${lowStock > 0 ? "border-destructive/50 bg-destructive/5" : "border-border bg-card/30"}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className={`text-xs font-bold uppercase tracking-widest ${lowStock > 0 ? "text-destructive" : "text-muted-foreground"}`}>Alertas de Stock</CardTitle>
            <div className={`h-6 w-6 rounded-none border flex items-center justify-center ${lowStock > 0 ? "border-destructive/30 bg-destructive/10" : "border-border bg-muted/50"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" className={`h-3 w-3 ${lowStock > 0 ? "text-destructive" : "text-muted-foreground"}`}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${lowStock > 0 ? "text-destructive" : "text-foreground"}`}>{lowStock}</div>
            <p className={`text-[10px] mt-2 font-medium uppercase tracking-wider ${lowStock > 0 ? "text-destructive/80" : "text-muted-foreground"}`}>Artículos necesitan reposición</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Productos</CardTitle>
            <div className="h-6 w-6 rounded-none border border-primary/20 bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-3 w-3 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{productsCount}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">En catálogo</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categorías</CardTitle>
            <div className="h-6 w-6 rounded-none border border-primary/20 bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-3 w-3 text-primary"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{String(categoriesCount)}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">Clasificaciones</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clientes</CardTitle>
            <div className="h-6 w-6 rounded-none border border-primary/20 bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-3 w-3 text-primary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{String(customersCount)}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">Registrados</p>
          </CardContent>
        </Card>

        <Card className={`rounded-none border shadow-none ${debtValue > 0 ? "border-destructive/50 bg-destructive/5" : "border-border bg-card/30"}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className={`text-xs font-bold uppercase tracking-widest ${debtValue > 0 ? "text-destructive" : "text-muted-foreground"}`}>Cuentas por Cobrar</CardTitle>
            <div className={`h-6 w-6 rounded-none border flex items-center justify-center ${debtValue > 0 ? "border-destructive/30 bg-destructive/10" : "border-border bg-muted/50"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" className={`h-3 w-3 ${debtValue > 0 ? "text-destructive" : "text-muted-foreground"}`}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${debtValue > 0 ? "text-destructive" : "text-foreground"}`}>${debtValue.toFixed(2)}</div>
            <p className={`text-[10px] mt-2 font-medium uppercase tracking-wider ${debtValue > 0 ? "text-destructive/80" : "text-muted-foreground"}`}>En cartera</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Transacciones Recientes</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider">
              Últimas ventas registradas en el Punto de Venta.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader className="bg-background/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="uppercase text-[10px] tracking-widest font-bold h-10">Cliente / Cajero</TableHead>
                    <TableHead className="hidden sm:table-cell uppercase text-[10px] tracking-widest font-bold h-10">Artículos</TableHead>
                    <TableHead className="hidden md:table-cell uppercase text-[10px] tracking-widest font-bold h-10">Fecha</TableHead>
                    <TableHead className="text-right uppercase text-[10px] tracking-widest font-bold h-10">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.length === 0 ? (
                    <TableRow className="border-border">
                      <TableCell colSpan={4} className="h-24 text-center text-xs uppercase text-muted-foreground">
                        No se encontraron ventas recientes. ¡Vaya a POS para hacer una venta!
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentSales.map((sale) => (
                      <TableRow key={sale.id} className="border-border hover:bg-primary/5 transition-colors">
                        <TableCell>
                          <div className="font-bold text-xs uppercase text-foreground">{sale.user?.name || sale.user?.email || 'Usuario Desconocido'}</div>
                          <div className="hidden text-[10px] uppercase text-muted-foreground md:inline mt-1">
                            {sale.items.length} producto(s) vendido(s)
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-[10px] uppercase line-clamp-1 max-w-[200px] text-muted-foreground border-l-2 border-primary/50 pl-2">
                            {sale.items.map(i => i.product.name).join(", ")}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-[10px] uppercase tracking-wider">
                          {sale.createdAt.toLocaleDateString()} {sale.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-primary">
                          ${sale.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="rounded-none border border-border bg-card/30 shadow-none h-fit">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Acciones Rápidas</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider">Atajos para gestionar su tienda</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 p-4">
            <Link href="/pos" className="group flex items-center gap-3 rounded-none border border-border bg-background p-3 hover:border-primary transition-all cursor-pointer shadow-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 text-primary group-hover:text-primary-foreground"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Nueva Venta</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Abrir POS</p>
              </div>
            </Link>
            <Link href="/products" className="group flex items-center gap-3 rounded-none border border-border bg-background p-3 hover:border-primary transition-all cursor-pointer shadow-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 text-primary group-hover:text-primary-foreground"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Añadir Producto</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Nuevo inventario</p>
              </div>
            </Link>
            <Link href="/customers" className="group flex items-center gap-3 rounded-none border border-border bg-background p-3 hover:border-primary transition-all cursor-pointer shadow-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 text-primary group-hover:text-primary-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Nuevo Cliente</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Registrar cliente</p>
              </div>
            </Link>
            <Link href="/categories" className="group flex items-center gap-3 rounded-none border border-border bg-background p-3 hover:border-primary transition-all cursor-pointer shadow-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 text-primary group-hover:text-primary-foreground"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Nueva Categoría</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Clasificación</p>
              </div>
            </Link>
            <Link href="/invoices" className="group flex items-center gap-3 rounded-none border border-border bg-background p-3 hover:border-primary transition-all cursor-pointer shadow-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 text-primary group-hover:text-primary-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Ver Facturas</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Facturación</p>
              </div>
            </Link>
            <Link href="/reports" className="group flex items-center gap-3 rounded-none border border-border bg-background p-3 hover:border-primary transition-all cursor-pointer shadow-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 text-primary group-hover:text-primary-foreground"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Reportes</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Análisis</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
    <FirstPasswordModal isOpen={user?.isFirstTime ?? false} />
    </>
  )
}
