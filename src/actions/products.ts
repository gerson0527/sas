"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getProducts(storeId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // For this prototype, we'll fetch products for the given store
  return await prisma.product.findMany({
    where: { storeId },
    include: { category: true, supplier: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createProduct(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const sku = formData.get("sku") as string
  const price = parseFloat(formData.get("price") as string)
  const regularPrice = parseFloat(formData.get("regularPrice") as string)
  const cost = parseFloat(formData.get("cost") as string)
  const stock = parseInt(formData.get("stock") as string)
  const minStock = parseInt(formData.get("minStock") as string) || 5
  const storeId = formData.get("storeId") as string

  const taxRate = parseFloat(formData.get("taxRate") as string) || 19
  const taxType = (formData.get("taxType") as string) || "TAXED"
  const unitMeasure = (formData.get("unitMeasure") as string) || "94"
  const standardCode = (formData.get("standardCode") as string) || null

  // We would normally validate the inputs here (e.g. Zod)

  await prisma.product.create({
    data: {
      name,
      sku,
      price,
      regularPrice: isNaN(regularPrice) ? null : regularPrice,
      cost: isNaN(cost) ? null : cost,
      stock: isNaN(stock) ? 0 : stock,
      minStock,
      taxRate,
      taxType,
      unitMeasure,
      standardCode,
      categoryId: formData.get("categoryId") ? (formData.get("categoryId") as string) : null,
      supplierId: formData.get("supplierId") ? (formData.get("supplierId") as string) : null,
      storeId,
    },
  })

  revalidatePath("/products")
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const sku = formData.get("sku") as string
  const price = parseFloat(formData.get("price") as string)
  const regularPrice = parseFloat(formData.get("regularPrice") as string)
  const cost = parseFloat(formData.get("cost") as string)
  const stock = parseInt(formData.get("stock") as string)
  const minStock = parseInt(formData.get("minStock") as string) || 5

  const taxRate = parseFloat(formData.get("taxRate") as string) || 19
  const taxType = (formData.get("taxType") as string) || "TAXED"
  const unitMeasure = (formData.get("unitMeasure") as string) || "94"
  const standardCode = (formData.get("standardCode") as string) || null

  await prisma.product.update({
    where: { id },
    data: {
      name,
      sku,
      price,
      regularPrice: isNaN(regularPrice) ? null : regularPrice,
      cost: isNaN(cost) ? null : cost,
      stock: isNaN(stock) ? 0 : stock,
      minStock,
      taxRate,
      taxType,
      unitMeasure,
      standardCode,
      categoryId: formData.get("categoryId") ? (formData.get("categoryId") as string) : null,
      supplierId: formData.get("supplierId") ? (formData.get("supplierId") as string) : null,
    },
  })

  revalidatePath("/products")
}

export async function deleteProduct(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.product.delete({
    where: { id },
  })

  revalidatePath("/products")
}
