"use client"

import { usePathname } from "next/navigation"

const pathSegments: Record<string, string> = {
  dashboard: "Resumen",
  pos: "Operaciones",
  products: "Inventario",
  categories: "Clasificaciones",
  suppliers: "Logística",
  returns: "Devoluciones",
  customers: "Directorio",
  invoices: "Facturas",
  finance: "Finanzas",
  reports: "Reportes",
  "settings/team": "Equipo",
  "settings/roles": "Roles",
  "settings/registers": "Cajas"
}

export function BreadcrumbInner() {
  const pathname = usePathname()
  const firstSegment = pathname.split("/")[1] || "dashboard"
  const label = pathSegments[firstSegment] || "Resumen"

  return (
    <div className="text-xs uppercase tracking-widest text-muted-foreground hidden sm:block">
      Comando Táctico / <span className="text-primary font-bold">{label}</span>
    </div>
  )
}