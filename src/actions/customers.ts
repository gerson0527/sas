"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getCustomers(storeId: string, search?: string, withDebtOnly?: boolean) {
  const where: any = { storeId }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { document: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ]
  }
  
  if (withDebtOnly) {
    where.balance = { gt: 0 }
  }
  
  return await prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
  })
}

export async function getCustomerWithHistory(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      sales: {
        include: {
          items: { include: { product: { select: { name: true } } } },
          user: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
      },
      payments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  })
  return customer
}

export async function getOverdueCustomers(storeId: string, days: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  // Find customers with old unpaid sales
  const overdueCustomers = await prisma.customer.findMany({
    where: {
      storeId,
      balance: { gt: 0 },
      sales: {
        some: {
          paymentStatus: "PENDING",
          createdAt: { lt: cutoffDate }
        }
      }
    },
    include: {
      sales: {
        where: { paymentStatus: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 1
      }
    }
  })
  
  return overdueCustomers.map(c => ({
    ...c,
    daysOverdue: c.sales[0] ? Math.floor((new Date().getTime() - c.sales[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
  }))
}

export async function getCustomerStats(storeId: string) {
  const [
    totalCustomers,
    withDebt,
    totalDebt,
    overdue30,
  ] = await Promise.all([
    prisma.customer.count({ where: { storeId } }),
    prisma.customer.count({ where: { storeId, balance: { gt: 0 } } }),
    prisma.customer.aggregate({ where: { storeId }, _sum: { balance: true } }),
    prisma.customer.count({
      where: {
        storeId,
        balance: { gt: 0 },
        sales: { some: { paymentStatus: "PENDING" } }
      }
    })
  ])
  
  return {
    totalCustomers,
    withDebt,
    totalDebt: totalDebt._sum.balance || 0,
    overdue30
  }
}

export async function createCustomer(storeId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const document = formData.get("document") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const creditLimitStr = formData.get("creditLimit") as string
  
  const creditLimit = creditLimitStr ? parseFloat(creditLimitStr) : 0

  if (!name) throw new Error("Name is required")

  await prisma.customer.create({
    data: {
      name,
      document,
      email,
      phone,
      address,
      creditLimit,
      storeId,
    },
  })

  revalidatePath("/customers")
}

export async function updateCustomer(id: string, storeId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const document = formData.get("document") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const creditLimitStr = formData.get("creditLimit") as string
  
  const creditLimit = creditLimitStr ? parseFloat(creditLimitStr) : 0

  if (!name) throw new Error("Name is required")

  await prisma.customer.update({
    where: { id, storeId },
    data: {
      name,
      document,
      email,
      phone,
      address,
      creditLimit,
    },
  })

  revalidatePath("/customers")
}

export async function deleteCustomer(id: string, storeId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.customer.delete({
    where: { id, storeId },
  })

  revalidatePath("/customers")
}

export async function registerPayment(customerId: string, storeId: string, formData: FormData) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("Unauthorized")

  const amountStr = formData.get("amount") as string
  const notes = formData.get("notes") as string
  
  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount")

  await prisma.$transaction(async (tx) => {
    // Register the payment
    await tx.customerPayment.create({
      data: {
        amount,
        notes,
        customerId,
        storeId,
        userId,
      },
    })

    // Update customer balance (decrement the debt)
    await tx.customer.update({
      where: { id: customerId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    })
  })

  revalidatePath("/customers")
}

export async function bulkCreateCustomers(storeId: string, customers: any[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validCustomers = customers.map((c) => ({
    name: c.NOMBRE || c.name || "Sin Nombre",
    document: c.DOCUMENTO?.toString() || c.document || null,
    email: c.EMAIL || c.email || null,
    phone: c.TELEFONO?.toString() || c.phone || null,
    address: c.DIRECCION || c.address || null,
    creditLimit: parseFloat(c.LIMITE_CREDITO || c.creditLimit) || 0,
    balance: parseFloat(c.DEUDA_INICIAL || c.balance) || 0,
    storeId,
  }))

  await prisma.customer.createMany({
    data: validCustomers,
    skipDuplicates: true
  })

  revalidatePath("/customers")
}
