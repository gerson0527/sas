"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getCategories(storeId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Get only parent categories (no parentId)
  return await prisma.category.findMany({
    where: { storeId, parentId: null },
    orderBy: { name: 'asc' },
    include: {
      subcategories: {
        orderBy: { name: 'asc' }
      },
      _count: {
        select: { products: true }
      }
    }
  })
}

export async function getAllCategories(storeId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  return await prisma.category.findMany({
    where: { storeId },
    orderBy: { name: 'asc' },
    include: {
      subcategories: {
        orderBy: { name: 'asc' }
      },
      _count: {
        select: { products: true }
      }
    }
  })
}

export async function createCategory(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const storeId = formData.get("storeId") as string
  const parentId = formData.get("parentId") as string | null

  if (!name || !storeId) {
    throw new Error("Missing required fields")
  }

  await prisma.category.create({
    data: {
      name,
      storeId,
      parentId: parentId || null,
    },
  })

  revalidatePath("/categories")
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const parentId = formData.get("parentId") as string | null

  if (!name) {
    throw new Error("Missing required fields")
  }

  // Check for circular reference
  if (parentId === id) {
    throw new Error("Una categoría no puede ser subcategoría de sí misma")
  }

  await prisma.category.update({
    where: { id },
    data: { 
      name,
      parentId: parentId || null
    },
  })

  revalidatePath("/categories")
}

export async function deleteCategory(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // First delete or orphan subcategories
  const subcategories = await prisma.category.findMany({
    where: { parentId: id }
  })

  if (subcategories.length > 0) {
    // Make subcategories parent-less
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    })
  }

  await prisma.category.delete({
    where: { id },
  })

  revalidatePath("/categories")
}
