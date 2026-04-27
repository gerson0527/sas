"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import type { Permission } from "@/lib/constants"

export async function getUserPermissions(storeId: string, userId: string): Promise<string[]> {
  const storeUser = await prisma.storeUser.findFirst({
    where: { storeId, userId },
    include: {
      customRole: {
        include: { permissions: true }
      }
    }
  })

  if (!storeUser?.customRole) {
    return []
  }

  return storeUser.customRole.permissions.map(p => p.name)
}

export async function checkPermission(storeId: string, permission: Permission): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  const permissions = await getUserPermissions(storeId, session.user.id)
  return permissions.includes(permission)
}

export async function requirePermission(storeId: string, permission: Permission) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const hasPermission = await checkPermission(storeId, permission)
  if (!hasPermission) {
    redirect("/dashboard?error=unauthorized")
  }
}

export async function requireAnyPermission(storeId: string, permissions: Permission[]) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userPermissions = await getUserPermissions(storeId, session.user.id)
  const hasAny = permissions.some(p => userPermissions.includes(p))
  
  if (!hasAny) {
    redirect("/dashboard?error=unauthorized")
  }
}

export async function getUserRole(storeId: string, userId: string): Promise<string | null> {
  const storeUser = await prisma.storeUser.findFirst({
    where: { storeId, userId },
    include: { customRole: true }
  })

  return storeUser?.customRole?.name || null
}