import { getAllRegisters, createRegister, updateRegister, deleteRegister } from "@/actions/registers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { RegistersClient } from "./RegistersClient"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

export default async function RegistersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userStore = await prisma.storeUser.findFirst({
    where: { userId: session.user.id },
    include: { store: true }
  })

  const storeId = userStore?.storeId
if (!storeId) redirect("/dashboard")

  const registers = await getAllRegisters(storeId)

  return (
    <RegistersClient 
      storeId={storeId}
      registers={registers}
    />
  )
}