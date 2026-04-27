import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SidebarNavClient } from "./SidebarNavClient"
import { NAV_ITEMS } from "@/lib/nav-items-data"

export async function SidebarNav() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userStore = await prisma.storeUser.findFirst({
    where: { userId: session.user.id },
    include: {
      customRole: {
        include: { permissions: true }
      }
    }
  })

  if (!userStore?.customRole) {
    return <SidebarNavClient items={[{ href: "/dashboard", label: "Centro de Mando", icon: "dashboard" }]} />
  }

  const userPermissions = userStore.customRole.permissions.map(p => p.name)

  const accessibleItems = NAV_ITEMS.filter(item => {
    if (!item.permission) return true
    return userPermissions.includes(item.permission)
  })

  return <SidebarNavClient items={accessibleItems} />
}