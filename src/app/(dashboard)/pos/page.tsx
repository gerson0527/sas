import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { POSClient } from "@/components/pos/POSClient"
import { getCurrentShift } from "@/actions/sales"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

export default async function POSPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userStores = await prisma.storeUser.findMany({
    where: { userId: session.user.id },
    include: { store: true }
  })

  const storeId = userStores[0]?.storeId

  if (!storeId) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-8">
        <div className="text-center p-12 border rounded-none max-w-md bg-card border-primary">
          <h2 className="text-2xl font-black text-primary mb-2">SIN CONFIGURACIÓN</h2>
          <p className="text-xs text-muted-foreground uppercase">Debes crear o ser invitados a una tienda primero.</p>
        </div>
      </div>
    )
  }

  await requirePermission(storeId, "process_sales")

  const products = await prisma.product.findMany({
    where: { storeId },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
      categoryId: true,
      category: { select: { name: true } },
      taxRate: true
    },
    orderBy: { name: 'asc' }
  })

  const categories = await prisma.category.findMany({
    where: { storeId },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: 'asc' }
  })

  const customers = await prisma.customer.findMany({
    where: { storeId },
    select: {
      id: true,
      name: true,
      document: true,
      balance: true,
      creditLimit: true
    },
    orderBy: { name: 'asc' }
  })

  const currentShift = await getCurrentShift(storeId)

  const registers = await prisma.cashRegister.findMany({
    where: { storeId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="h-full w-full bg-background overflow-hidden font-mono uppercase">
      <POSClient products={products} storeId={storeId} customers={customers} categories={categories} currentShift={currentShift} registers={registers} />
    </div>
  )
}
