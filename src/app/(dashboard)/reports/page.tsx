import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getReportData } from "@/actions/reports"
import { ReportsClient } from "@/components/reports/ReportsClient"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

export default async function ReportsPage() {
  const session = await auth()
  const userStore = await prisma.storeUser.findFirst({
    where: { userId: session?.user?.id },
    select: { storeId: true }
  })
  const storeId = userStore?.storeId
  if (!storeId) return null

  await requirePermission(storeId, "view_reports")

  const { today, weekly, monthly } = await getReportData(storeId)

  return (
    <ReportsClient storeId={storeId} initialData={{ today, weekly, monthly }} />
  )
}