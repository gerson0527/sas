"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NAV_ITEMS } from "@/lib/nav-items-data"

export async function getAccessibleNavItems() {
  const session = await auth()
  if (!session?.user?.id) return []

  const userStore = await prisma.storeUser.findFirst({
    where: { userId: session.user.id },
    include: {
      customRole: {
        include: { permissions: true }
      }
    }
  })

  if (!userStore?.customRole) return [{ href: "/dashboard", label: "Centro de Mando", icon: "dashboard" }]

  const userPermissions = userStore.customRole.permissions.map(p => p.name)

  return NAV_ITEMS.filter(item => {
    if (!item.permission) return true
    return userPermissions.includes(item.permission)
  })
}