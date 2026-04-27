import { getStoreUsers, getUserCustomRole } from "@/actions/team"
import { getRoles, seedDefaultRoles } from "@/actions/roles"
import { getRegisters } from "@/actions/registers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TeamClient } from "@/components/team/TeamClient"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

async function getUserStore() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.storeUser.findFirst({
    where: { userId: session.user.id },
    include: { store: true }
  })
}

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userStore = await getUserStore()
  if (!userStore) {
    redirect("/dashboard")
  }

  await requirePermission(userStore.storeId, "manage_users")

  await seedDefaultRoles(userStore.storeId)
  const [storeUsers, roles, registers] = await Promise.all([
    getStoreUsers(userStore.storeId),
    getRoles(userStore.storeId),
    getRegisters(userStore.storeId)
  ])

  return (
    <TeamClient 
      storeId={userStore.storeId}
      roles={roles}
      storeUsers={storeUsers}
      currentUserId={session.user.id}
      registers={registers}
    />
  )
}