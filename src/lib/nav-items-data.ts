export type NavItem = {
  href: string
  label: string
  icon: string
  permission?: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Centro de Mando", icon: "dashboard" },
  { href: "/pos", label: "Operaciones (POS)", icon: "pos", permission: "process_sales" },
  { href: "/products", label: "Inventario", icon: "products", permission: "manage_products" },
  { href: "/categories", label: "Clasificaciones", icon: "categories", permission: "manage_categories" },
  { href: "/suppliers", label: "Logística", icon: "suppliers", permission: "manage_suppliers" },
  { href: "/returns", label: "Devoluciones", icon: "returns", permission: "manage_returns" },
  { href: "/customers", label: "Directorio", icon: "customers", permission: "manage_customers" },
  { href: "/invoices", label: "Facturas", icon: "invoices", permission: "view_invoices" },
  { href: "/finance", label: "Finanzas", icon: "finance", permission: "manage_expenses" },
  { href: "/reports", label: "Reportes", icon: "reports", permission: "view_reports" },
  { href: "/settings/team", label: "Equipo", icon: "team", permission: "manage_users" },
  { href: "/settings/roles", label: "Roles", icon: "roles", permission: "manage_roles" },
  { href: "/settings/registers", label: "Cajas", icon: "registers", permission: "manage_registers" },
]