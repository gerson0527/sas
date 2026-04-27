export type Permission = 
  | "manage_users" 
  | "manage_roles" 
  | "manage_products" 
  | "manage_categories" 
  | "manage_suppliers" 
  | "manage_customers" 
  | "manage_purchases" 
  | "process_sales" 
  | "view_reports" 
  | "view_invoices"
  | "view_financials"
  | "manage_expenses"
  | "manage_returns"
  | "manage_registers"
  | "manage_settings" 

export const AVAILABLE_PERMISSIONS: { name: Permission; label: string; description: string; category: string }[] = [
  { name: "manage_users", label: "Gestión de Usuarios", description: "Gestionar usuarios del equipo", category: "Administración" },
  { name: "manage_roles", label: "Gestión de Roles", description: "Configurar roles y permisos", category: "Administración" },
  { name: "manage_products", label: "Gestión de Productos", description: "Crear, editar y eliminar productos", category: "Inventario" },
  { name: "manage_categories", label: "Gestión de Categorías", description: "Gestionar categorías", category: "Inventario" },
  { name: "manage_suppliers", label: "Gestión de Proveedores", description: "Gestionar proveedores", category: "Inventario" },
  { name: "manage_customers", label: "Gestión de Clientes", description: "Gestionar clientes", category: "Ventas" },
  { name: "manage_purchases", label: "Gestión de Compras", description: "Registrar compras a proveedores", category: "Inventario" },
  { name: "process_sales", label: "Procesar Ventas", description: "Procesar ventas en POS", category: "Ventas" },
  { name: "view_reports", label: "Ver Reportes", description: "Ver reportes de ventas", category: "Reportes" },
  { name: "view_invoices", label: "Ver Facturas", description: "Ver historial de facturas", category: "Reportes" },
  { name: "view_financials", label: "Ver Finanzas", description: "Ver estado financiero", category: "Reportes" },
  { name: "manage_expenses", label: "Gestión de Gastos", description: "Gestionar gastos", category: "Finanzas" },
  { name: "manage_returns", label: "Gestión de Devoluciones", description: "Procesar devoluciones", category: "Ventas" },
  { name: "manage_registers", label: "Gestión de Cajas", description: "Gestionar cajas registradoras", category: "Administración" },
  { name: "manage_settings", label: "Ajustes de Tienda", description: "Configurar tienda", category: "Administración" },
]
