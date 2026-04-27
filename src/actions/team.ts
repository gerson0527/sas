"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

interface StoreUserWithUser {
  id: string
  customRoleId: string | null
  customRole: {
    id: string
    name: string
  } | null
  userId: string
  storeId: string
  defaultCashRegisterId: string | null
  defaultCashRegister: { name: string } | null
  user: {
    id: string
    name: string | null
    email: string
  }
}

export async function getStoreUsers(storeId: string): Promise<StoreUserWithUser[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const storeUsers = await prisma.storeUser.findMany({
    where: { storeId },
    include: {
      customRole: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      defaultCashRegister: {
        select: { name: true }
      }
    },
    orderBy: {
      user: {
        name: 'asc'
      }
    }
  })

  return storeUsers
}

export async function getUserCustomRole(storeId: string): Promise<{ id: string; name: string } | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const storeUser = await prisma.storeUser.findUnique({
    where: {
      userId_storeId: {
        userId: session.user.id,
        storeId
      }
    },
    include: { customRole: true }
  })

  return storeUser?.customRole || null
}

export async function inviteUser(storeId: string, email: string, customRoleId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return { error: "User not found" }
  }

  const existingLink = await prisma.storeUser.findUnique({
    where: {
      userId_storeId: {
        userId: user.id,
        storeId
      }
    }
  })

  if (existingLink) {
    return { error: "User already linked to this store" }
  }

  await prisma.storeUser.create({
    data: {
      userId: user.id,
      storeId,
      customRoleId
    }
  })

  revalidatePath('/settings/team')
  return { success: true }
}

export async function updateUserRole(storeUserId: string, customRoleId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const storeUser = await prisma.storeUser.findUnique({
    where: { id: storeUserId }
  })

  if (!storeUser) {
    throw new Error("Store user not found")
  }

  await prisma.storeUser.update({
    where: { id: storeUserId },
    data: { customRoleId }
  })

  revalidatePath('/settings/team')
  return { success: true }
}

export async function removeUserFromStore(storeUserId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const storeUser = await prisma.storeUser.findUnique({
    where: { id: storeUserId }
  })

  if (!storeUser) {
    throw new Error("Store user not found")
  }

  await prisma.storeUser.delete({
    where: { id: storeUserId }
  })

  revalidatePath('/settings/team')
  return { success: true }
}

type CreateTeamUserInput = {
  name: string
  email: string
  password: string
  roleId: string
  defaultCashRegisterId?: string | null
}

export async function createTeamUser(storeId: string, data: CreateTeamUserInput) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    return { error: "Ya existe un usuario con este correo" }
  }

  const bcrypt = await import("bcryptjs")
  const hashedPassword = await bcrypt.hash(data.password, 10)

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword
    }
  })

  await prisma.storeUser.create({
    data: {
      userId: newUser.id,
      storeId,
      customRoleId: data.roleId,
      defaultCashRegisterId: data.defaultCashRegisterId || null
    }
  })

  revalidatePath('/settings/team')
  return { success: true }
}

export async function removeUser(storeId: string, storeUserId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await prisma.storeUser.delete({
    where: { id: storeUserId }
  })

  revalidatePath('/settings/team')
  return { success: true }
}

export async function updateUserStore(storeUserId: string, data: {
  customRoleId?: string | null
  defaultCashRegisterId?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await prisma.storeUser.update({
    where: { id: storeUserId },
    data
  })

  revalidatePath('/settings/team')
  return { success: true }
}