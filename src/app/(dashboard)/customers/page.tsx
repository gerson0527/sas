import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCustomers, getCustomerStats } from "@/actions/customers"
import CustomersClient from "./CustomersClient"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

export default async function CustomersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { stores: true }
  })
  
  if (!user || user.stores.length === 0) redirect("/setup")
  const storeId = user.stores[0].storeId

  await requirePermission(storeId, "manage_customers")

  const [customers, stats] = await Promise.all([
    getCustomers(storeId),
    getCustomerStats(storeId)
  ])

  return <CustomersClient storeId={storeId} initialCustomers={customers} initialStats={stats} />
}