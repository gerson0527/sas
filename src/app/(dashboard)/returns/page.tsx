import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getReturnsReport } from "@/actions/reports"
import { ReturnsClient } from "@/components/returns/ReturnsClient"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

export default async function ReturnsPage() {
  const session = await auth()
  const userStore = await prisma.storeUser.findFirst({
    where: { userId: session?.user?.id },
    select: { storeId: true }
  })
  const storeId = userStore?.storeId
  if (!storeId) return null

  await requirePermission(storeId, "manage_returns")

  const report = await getReturnsReport(storeId)

  return (
    <ReturnsClient storeId={storeId} initialReport={report} />
  )
}