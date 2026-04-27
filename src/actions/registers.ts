"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getRegisters(storeId: string) {
  return await prisma.cashRegister.findMany({
    where: { storeId, isActive: true },
    orderBy: { name: "asc" }
  })
}

export async function getAllRegisters(storeId: string) {
  return await prisma.cashRegister.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { cashShifts: true }
      }
    }
  })
}

export async function createRegister(storeId: string, data: {
  name: string
  location?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const register = await prisma.cashRegister.create({
    data: {
      storeId,
      name: data.name,
      location: data.location,
      isActive: true
    }
  })

  revalidatePath("/settings/registers")
  revalidatePath("/pos")
  return register
}

export async function updateRegister(id: string, data: {
  name?: string
  location?: string
  isActive?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const register = await prisma.cashRegister.update({
    where: { id },
    data
  })

  revalidatePath("/settings/registers")
  revalidatePath("/pos")
  return register
}

export async function deleteRegister(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Check if there are shifts using this register
  const shiftCount = await prisma.cashShift.count({
    where: { cashRegisterId: id }
  })

  if (shiftCount > 0) {
    // Soft delete - just deactivate
    await prisma.cashRegister.update({
      where: { id },
      data: { isActive: false }
    })
  } else {
    // Hard delete if no shifts
    await prisma.cashRegister.delete({
      where: { id }
    })
  }

  revalidatePath("/settings/registers")
  revalidatePath("/pos")
}

export async function getUserRegisters(userId: string, storeId: string) {
  // Get user's default register or all active registers
  const storeUser = await prisma.storeUser.findUnique({
    where: {
      userId_storeId: {
        userId,
        storeId
      }
    },
    include: {
      defaultCashRegister: true
    }
  })

  if (storeUser?.defaultCashRegister) {
    return [storeUser.defaultCashRegister]
  }

  // If no default, return all active registers
  return await prisma.cashRegister.findMany({
    where: { storeId, isActive: true },
    orderBy: { name: "asc" }
  })
}