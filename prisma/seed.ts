import { PrismaClient } from "@prisma/client"
import type { Permission } from "../src/lib/constants"

const prisma = new PrismaClient()

const ALL_PERMISSIONS: Permission[] = [
  "manage_users", "manage_roles", "manage_products", "manage_categories",
  "manage_suppliers", "manage_customers", "manage_purchases", "process_sales",
  "view_reports", "view_invoices", "view_financials", "manage_expenses",
  "manage_returns", "manage_registers", "manage_settings"
]

const CASHIER_PERMISSIONS: Permission[] = [
  "process_sales", "view_invoices", "manage_returns"
]

async function seedPermissions() {
  const permissions = await Promise.all(
    ALL_PERMISSIONS.map(async (name) => {
      const perm = await prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: getPermissionDescription(name) }
      })
      return perm
    })
  )
  return permissions
}

function getPermissionDescription(name: Permission): string {
  const descriptions: Record<Permission, string> = {
    manage_users: "Gestionar usuarios del equipo",
    manage_roles: "Configurar roles y permisos",
    manage_products: "Crear, editar y eliminar productos",
    manage_categories: "Gestionar categorías",
    manage_suppliers: "Gestionar proveedores",
    manage_customers: "Gestionar clientes",
    manage_purchases: "Registrar compras a proveedores",
    process_sales: "Procesar ventas en POS",
    view_reports: "Ver reportes de ventas",
    view_invoices: "Ver historial de facturas",
    view_financials: "Ver estado financiero",
    manage_expenses: "Gestionar gastos",
    manage_returns: "Procesar devoluciones",
    manage_registers: "Gestionar cajas registradoras",
    manage_settings: "Configurar tienda"
  }
  return descriptions[name]
}

async function seedRoles(storeId: string) {
  const permissions = await seedPermissions()
  const permMap = new Map(permissions.map(p => [p.name, p]))

  const adminPerms = ALL_PERMISSIONS.map(p => permMap.get(p)!)
  const cashierPerms = CASHIER_PERMISSIONS.map(p => permMap.get(p)!).filter(Boolean)

  await prisma.customRole.upsert({
    where: { id: `role-admin-${storeId}` },
    update: {},
    create: {
      id: `role-admin-${storeId}`,
      name: "Administrador",
      storeId,
      permissions: { connect: adminPerms.map(p => ({ id: p.id })) }
    }
  })

  await prisma.customRole.upsert({
    where: { id: `role-cashier-${storeId}` },
    update: {},
    create: {
      id: `role-cashier-${storeId}`,
      name: "Cajero",
      storeId,
      permissions: { connect: cashierPerms.map(p => ({ id: p.id })) }
    }
  })

  console.log("✅ Roles: Administrador (todos los permisos), Cajero (ventas y devoluciones)")
}

async function main() {
  console.log("🌱 Starting seed...")

  let store = await prisma.store.findFirst()
  
  if (!store) {
    console.log("📦 Creating demo store...")
    store = await prisma.store.create({
      data: { name: "TIENDA DEMO" }
    })
    console.log("📍 Demo store created:", store.name)
  } else {
    console.log("📍 Store:", store.name)
  }

  await seedRoles(store.id)

  // Categories
  const clothing = await prisma.category.upsert({
    where: { id: "cat-clothing" },
    update: {},
    create: { id: "cat-clothing", name: "ROPA", storeId: store.id }
  })

  const electronics = await prisma.category.upsert({
    where: { id: "cat-electronics" },
    update: {},
    create: { id: "cat-electronics", name: "ELECTRÓNICOS", storeId: store.id }
  })

  const accessories = await prisma.category.upsert({
    where: { id: "cat-accessories" },
    update: {},
    create: { id: "cat-accessories", name: "ACCESORIOS", storeId: store.id }
  })

  const food = await prisma.category.upsert({
    where: { id: "cat-food" },
    update: {},
    create: { id: "cat-food", name: "ABARROTES", storeId: store.id }
  })

  console.log("✅ Categories:", clothing.name, electronics.name, accessories.name, food.name)

  // Subcategories
  const shirts = await prisma.category.upsert({
    where: { id: "cat-shirts" },
    update: {},
    create: { id: "cat-shirts", name: "CAMISAS", storeId: store.id, parentId: clothing.id }
  })

  const pants = await prisma.category.upsert({
    where: { id: "cat-pants" },
    update: {},
    create: { id: "cat-pants", name: "PANTALONES", storeId: store.id, parentId: clothing.id }
  })

  const phones = await prisma.category.upsert({
    where: { id: "cat-phones" },
    update: {},
    create: { id: "cat-phones", name: "CELULARES", storeId: store.id, parentId: electronics.id }
  })

  console.log("✅ Subcategories:", shirts.name, pants.name, phones.name)

  // Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { id: "sup-alfa" },
    update: {},
    create: { id: "sup-alfa", name: "ALFA DISTRIBUTIONS", email: "alfa@supplier.com", phone: "3001234567", storeId: store.id }
  })

  const supplier2 = await prisma.supplier.upsert({
    where: { id: "sup-beta" },
    update: {},
    create: { id: "sup-beta", name: "BETA IMPORTADORA", email: "beta@supplier.com", phone: "3007654321", storeId: store.id }
  })

  console.log("✅ Suppliers:", supplier1.name, supplier2.name)

  // Products
  const products = [
    { id: "prod-1", name: "CAMISA MANGA LARGA BLANCA", sku: "CAM-ML-BLA", price: 45000, cost: 25000, stock: 50, categoryId: shirts.id, supplierId: supplier1.id },
    { id: "prod-2", name: "CAMISA MANGA LARGA NEGRA", sku: "CAM-ML-NEG", price: 45000, cost: 25000, stock: 45, categoryId: shirts.id, supplierId: supplier1.id },
    { id: "prod-3", name: "CAMISA MANGA CORTA AZUL", sku: "CAM-MC-AZL", price: 40000, cost: 22000, stock: 60, categoryId: shirts.id, supplierId: supplier1.id },
    { id: "prod-4", name: "PANTALÓN JEANS AZUL", sku: "PAN-JEANS-AZL", price: 80000, cost: 45000, stock: 30, categoryId: pants.id, supplierId: supplier1.id },
    { id: "prod-5", name: "PANTALÓN JEANS NEGRO", sku: "PAN-JEANS-NEG", price: 80000, cost: 45000, stock: 28, categoryId: pants.id, supplierId: supplier1.id },
    { id: "prod-6", name: "SHORT JEANS CLARO", sku: "SHT-JEANS-CLR", price: 55000, cost: 30000, stock: 40, categoryId: pants.id, supplierId: supplier1.id },
    { id: "prod-7", name: "SAMSUNG A14 128GB", sku: "SUM-A14-128", price: 750000, cost: 580000, stock: 15, categoryId: phones.id, supplierId: supplier2.id },
    { id: "prod-8", name: "SAMSUNG A24 256GB", sku: "SUM-A24-256", price: 950000, cost: 720000, stock: 12, categoryId: phones.id, supplierId: supplier2.id },
    { id: "prod-9", name: "REDMI NOTE 13", sku: "REDM-N13-256", price: 680000, cost: 520000, stock: 20, categoryId: phones.id, supplierId: supplier2.id },
    { id: "prod-10", name: "AIRPODS PRO 2", sku: "AIR-PRO2", price: 380000, cost: 280000, stock: 25, categoryId: electronics.id, supplierId: supplier2.id },
    { id: "prod-11", name: "CARGADOR SAMSUNG 25W", sku: "CAR-SAM-25", price: 85000, cost: 45000, stock: 50, categoryId: electronics.id, supplierId: supplier2.id },
    { id: "prod-12", name: "CABLE USB-C", sku: "CAB-USBC", price: 35000, cost: 15000, stock: 100, categoryId: electronics.id, supplierId: supplier2.id },
    { id: "prod-13", name: "CORREO NEGRO PIEL", sku: "COR-NEG-PIL", price: 65000, cost: 35000, stock: 20, categoryId: accessories.id, supplierId: supplier1.id },
    { id: "prod-14", name: "BILLETERA CAFÉ", sku: "BIL-CAF", price: 45000, cost: 22000, stock: 30, categoryId: accessories.id, supplierId: supplier1.id },
    { id: "prod-15", name: "GAFAS SOL NEGRAS", sku: "GAF-SOL-NEG", price: 55000, cost: 28000, stock: 25, categoryId: accessories.id, supplierId: supplier1.id },
    { id: "prod-16", name: "ARROZ DORA 500G", sku: "ARR-DOR-500", price: 5500, cost: 4200, stock: 100, categoryId: food.id, supplierId: supplier1.id },
    { id: "prod-17", name: "ACEITE GOROO 500ML", sku: "ACE-GOR-500", price: 7500, cost: 5500, stock: 80, categoryId: food.id, supplierId: supplier1.id },
    { id: "prod-18", name: "AZÚCAR BLANCA 1KG", sku: "AZU-BLA-1K", price: 4500, cost: 3200, stock: 120, categoryId: food.id, supplierId: supplier1.id },
    { id: "prod-19", name: "SAL MARINA 500G", sku: "SAL-MAR-500", price: 3500, cost: 2000, stock: 90, categoryId: food.id, supplierId: supplier1.id },
    { id: "prod-20", name: "FIDEOS PREMIUM 250G", sku: "FID-PREM-250", price: 4200, cost: 2800, stock: 70, categoryId: food.id, supplierId: supplier1.id },
  ]

  for (const prod of products) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: prod,
      create: { ...prod, storeId: store.id }
    })
  }

  console.log("✅ Products:", products.length)

  // Customers
  const customers = [
    { id: "cust-1", name: "JUAN PEREZ", document: "1001234567", balance: 0, creditLimit: 500000, storeId: store.id },
    { id: "cust-2", name: "MARÍA GARCÍA", document: "43215678", balance: 150000, creditLimit: 300000, storeId: store.id },
    { id: "cust-3", name: "PEDRO RODRÍGUEZ", document: "80765432", balance: 0, creditLimit: 1000000, storeId: store.id },
    { id: "cust-4", name: "LUISA FERNANDEZ", document: "12345678", balance: 85000, creditLimit: 200000, storeId: store.id },
  ]

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { id: cust.id },
      update: cust,
      create: cust
    })
  }

  console.log("✅ Customers:", customers.length)
  console.log("🎉 Seed completed!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())