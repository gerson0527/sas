import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ThemeToggle } from "@/components/ThemeToggle"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { BreadcrumbInner } from "@/components/layout/Breadcrumb"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userStores = await prisma.storeUser.findFirst({
    where: { userId: session.user.id },
    include: { store: true }
  })

  if (!userStores) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground" suppressHydrationWarning>
      {/* Left Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card/30 md:flex sticky top-0 h-screen overflow-hidden" suppressHydrationWarning>
        <div className="flex h-16 items-center border-b border-border px-6" suppressHydrationWarning>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-5 w-5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-primary text-sm uppercase tracking-widest leading-none mt-1">SAAS INVENTORY</span>
              <span className="text-[10px] text-muted-foreground uppercase">v1.0.0 Online</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4" suppressHydrationWarning>
          <SidebarNav />
        </div>

        <div className="mt-auto border-t border-border p-4" suppressHydrationWarning>
          <div className="rounded-none border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs font-bold text-primary uppercase">Sistema en Línea</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase flex flex-col gap-1">
              <span>STORE: {userStores.store.name}</span>
              <span>USER: {session.user?.name || session.user?.email}</span>
            </div>
            <form action="/api/auth/signout" method="POST" className="mt-3">
              <button className="text-[10px] text-destructive hover:bg-destructive/10 w-full py-1 border border-destructive/30 uppercase transition-colors">
                Iniciar Desconexión
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden" suppressHydrationWarning>
        {/* Top Header (Mobile & Breadcrumb) */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/30 px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button - simple placeholder for now */}
            <button className="md:hidden text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-6 w-6"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <BreadcrumbInner />
          </div>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="hidden md:inline-block">Última Actualización: {new Date().toISOString().replace('T', ' ').substring(0, 16)} UTC</span>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}