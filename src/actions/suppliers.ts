"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getSuppliers(storeId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  return await prisma.supplier.findMany({
    where: { storeId },
    include: {
      _count: {
        select: { products: true }
      }
    }
  })
}

export async function createSupplier(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const email = formData.get("email") as string | null
  const phone = formData.get("phone") as string | null
  const storeId = formData.get("storeId") as string

  if (!name || !storeId) {
    throw new Error("Missing required fields")
  }

  await prisma.supplier.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      storeId,
    },
  })

  revalidatePath("/suppliers")
}

export async function updateSupplier(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const email = formData.get("email") as string | null
  const phone = formData.get("phone") as string | null

  if (!name) {
    throw new Error("Missing required fields")
  }

  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      email: email || null,
      phone: phone || null,
    },
  })

  revalidatePath("/suppliers")
}

export async function deleteSupplier(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.supplier.delete({
    where: { id }
  })

  revalidatePath("/suppliers")
}

export async function getSupplierProducts(supplierId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Get all products from this supplier through purchase history
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: { store: true }
  })

  if (!supplier) return []

  // Get products that have been purchased from this supplier
  const purchases = await prisma.purchase.findMany({
    where: { supplierId },
    include: {
      items: true
    }
  })

  const productIds = new Set<string>()
  purchases.forEach(p => p.items.forEach(i => productIds.add(i.productId)))

  const products = await prisma.product.findMany({
    where: { 
      id: { in: Array.from(productIds) },
      storeId: supplier.storeId
    },
    select: {
      id: true,
      name: true,
      stock: true,
      cost: true
    }
  })

  return products.sort((a, b) => a.name.localeCompare(b.name))
}
