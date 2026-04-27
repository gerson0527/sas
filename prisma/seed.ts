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

  // Create 10 Categories
  const categories = [
    { name: "ROPA HOMBRE", subcategories: ["CAMISAS", "PANTALONES", "SHORTS", "CAMISETAS", "SACOS", "CHAQUETAS"] },
    { name: "ROPA MUJER", subcategories: ["BLUSAS", "VESTIDOS", "FALDAS", "PANTALONES", "SHORTS", "CAMISETAS"] },
    { name: "ROPA NIÑOS", subcategories: ["CAMISAS", "PANTALONES", "VESTIDOS", "CAMISETAS", "SHORTS"] },
    { name: "ELECTRÓNICOS", subcategories: ["CELULARES", "TABLETS", "AURICULARES", "CARGADORES", "CABLES", "PARLANTES", "SMARTWATCH"] },
    { name: "ACCESORIOS", subcategories: ["BILLETERAS", "CINTURONES", "GAFAS", "BOLSOS", "MOCHILAS", "BUFANDAS"] },
    { name: "CALZADO", subcategories: ["TENIS", "ZAPATOS", "SANDALIAS", "BOTAS", "ZAPATILLAS"] },
    { name: "ABARROTES", subcategories: ["ARROZ", "AZÚCAR", "ACEITES", "FIDEOS", "LATAS", "SAL", "CAFÉ", "HARINAS"] },
    { name: "BELLEZA", subcategories: ["JABONES", "SHAMPOO", "CREMAS", "DESODORANTES", "LOCIONES"] },
    { name: "DEPORTES", subcategories: ["BALONES", "RAQUETAS", "CAMISETAS", "SHORTS", "TENIS"] },
    { name: "HOGAR", subcategories: ["ESCOBAS", "TRAPEADORES", "VELAS", "JABONES", "BLQUEADORES"] }
  ]

  const colorOptions = ["BLANCO", "NEGRO", "AZUL", "ROJO", "VERDE", "GRIS", "CAFE", "ROSADO"]
  const sizeOptions = ["S", "M", "L", "XL", "U"]

  const categoryMap = new Map<string, string>()
  const subCategoryMap = new Map<string, string>()

  // Create categories and subcategories
  let catIndex = 0
  let subCatIndex = 0
  
  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { id: `cat-${catIndex}` },
      update: {},
      create: { id: `cat-${catIndex}`, name: cat.name, storeId: store.id }
    })
    categoryMap.set(cat.name, parent.id)
    
    for (const subName of cat.subcategories) {
      const sub = await prisma.category.upsert({
        where: { id: `sub-${subCatIndex}` },
        update: {},
        create: { id: `sub-${subCatIndex}`, name: subName, storeId: store.id, parentId: parent.id }
      })
      subCategoryMap.set(subName, sub.id)
      subCatIndex++
    }
    catIndex++
  }
  console.log(`✅ Categories: ${categories.length} + ${subCategoryMap.size} subcategories`)

  // Create Suppliers
  const supplierNames = ["ALFA DISTRIBUTIONS", "BETA IMPORTADORA", "GAMMA CORP", "DELTA PRODUCTS", "EPSILON SA", "ZETA HOLDINGS", "ETA TRADING", "THETA INC", "IOTA LOGISTICS", "KAPPA COMMERCE"]
  const suppliers = []
  
  for (let i = 0; i < supplierNames.length; i++) {
    const sup = await prisma.supplier.upsert({
      where: { id: `sup-${i}` },
      update: {},
      create: { id: `sup-${i}`, name: supplierNames[i], email: ` supplier${i}@supplier.com`, phone: `300${Math.floor(Math.random() * 9000000 + 1000000)}`, storeId: store.id }
    })
    suppliers.push(sup)
  }
  console.log(`✅ Suppliers: ${suppliers.length}`)

  // Generate 500 Products
  const productKeys = Array.from(subCategoryMap.keys())
  for (let i = 0; i < 500; i++) {
    const subName = productKeys[i % productKeys.length]
    const subCatId = subCategoryMap.get(subName)!
    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)]
    const size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)]
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
    
    const basePrice = Math.floor(Math.random() * 500000) + 10000
    const price = Math.round(basePrice / 1000) * 1000
    const cost = Math.round(price * (0.4 + Math.random() * 0.3))
    const stock = Math.floor(Math.random() * 95) + 5
    const taxRates = [0, 5, 19]
    const taxRate = taxRates[Math.floor(Math.random() * taxRates.length)]
    
    let name = `${subName} ${color}`
    if (Math.random() > 0.5) name = `${name} TALLA ${size}`
    
    const regularPrice = price > 60000 ? Math.round(price * (1 + Math.random() * 0.3) / 1000) * 1000 : null
    
    await prisma.product.upsert({
      where: { id: `prod-${i}` },
      update: {},
      create: {
        id: `prod-${i}`,
        name,
        sku: `SKU-${String(i+1).padStart(4, '0')}`,
        price,
        regularPrice,
        cost,
        stock,
        minStock: Math.floor(Math.random() * 7) + 3,
        taxRate,
        taxType: taxRate === 0 ? "EXEMPT" : "TAXED",
        unitMeasure: "94",
        categoryId: subCatId,
        supplierId: supplier.id,
        storeId: store.id
      }
    })
  }
  console.log("✅ Products: 500")

  // Create Customers
  const customerNames = ["JUAN PEREZ", "MARÍA GARCÍA", "PEDRO RODRÍGUEZ", "LUISA FERNANDEZ", "CARLOS MARTINEZ", "ANA LÓPEZ", "JORGE CASTRO", "LAURA RAMIREZ", "MANUEL TORRES", "SOFIA MORALES"]
  
  for (let i = 0; i < customerNames.length; i++) {
    await prisma.customer.upsert({
      where: { id: `cust-${i}` },
      update: {},
      create: { id: `cust-${i}`, name: customerNames[i], document: String(10000000 + i * 1000000), balance: Math.floor(Math.random() * 500000), creditLimit: Math.floor(Math.random() * 900000 + 100000), storeId: store.id }
    })
  }
  console.log("✅ Customers: 10")

  console.log("🎉 Seed completed!")
  console.log("📊 Summary: 10 categories, 61 subcategories, 500 products, 10 suppliers, 10 customers")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())