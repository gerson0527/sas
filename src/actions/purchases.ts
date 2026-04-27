"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createSupplierReturn(
  supplierId: string,
  items: { productId: string, quantity: number, cost: number, reason: string }[],
  notes?: string
) {
  const session = await auth()
  const userId = session?.user?.id
  
  if (!userId) throw new Error("Unauthorized")

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId }
  })

  if (!supplier) throw new Error("Proveedor no encontrado")

  const totalReturn = items.reduce((acc, item) => acc + (item.cost * item.quantity), 0)
  
  // Get storeId from supplier
  const storeId = supplier.storeId

  // Create purchase (isReturn = true)
  const purchase = await prisma.purchase.create({
    data: {
      total: -totalReturn, // Negative for return
      notes: notes || items.map(i => i.reason).join(", "),
      isReturn: true,
      returnReason: notes || "Productos dañados",
      supplierId,
      storeId,
      userId,
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: -item.quantity, // Negative quantity
          cost: item.cost
        }))
      }
    }
  })

  // Update stock for each returned item
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    })

    await prisma.stockMovement.create({
      data: {
        type: "RETURN_TO_SUPPLIER",
        quantity: -item.quantity,
        notes: item.reason,
        productId: item.productId,
        userId,
        supplierName: supplier.name,
        returnInvoiceId: purchase.id
      }
    })
  }

  revalidatePath("/suppliers")
  revalidatePath("/products")
  revalidatePath("/finance")

  return { success: true, purchaseId: purchase.id }
}

export async function getSupplierReturns(supplierId: string) {
  return await prisma.purchase.findMany({
    where: { 
      supplierId,
      isReturn: true
    },
    orderBy: { createdAt: "desc" }
  })
}