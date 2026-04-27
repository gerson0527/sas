"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createExpense(storeId: string, data: {
  description: string
  amount: number
  category: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const expense = await prisma.expense.create({
    data: {
      storeId,
      userId: session.user.id,
      description: data.description,
      amount: data.amount,
      category: data.category as any,
    },
  })

  revalidatePath("/finance")
  return expense
}

export async function getExpenses(storeId: string, startDate?: Date, endDate?: Date) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const where: any = { storeId }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  return await prisma.expense.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.expense.delete({ where: { id } })
  revalidatePath("/finance")
}

export async function getFinanceSummary(storeId: string, filter: { startDate?: string; endDate?: string } = {}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  let startOfDay: Date
  let endOfDay: Date

  if (filter.startDate && filter.endDate) {
    startOfDay = new Date(filter.startDate + "T00:00:00")
    endOfDay = new Date(filter.endDate + "T23:59:59.999")
  } else if (filter.startDate) {
    startOfDay = new Date(filter.startDate + "T00:00:00")
    endOfDay = new Date(filter.startDate + "T23:59:59.999")
  } else if (filter.endDate) {
    startOfDay = new Date(filter.endDate + "T00:00:00")
    endOfDay = new Date(filter.endDate + "T23:59:59.999")
  } else {
    const targetDate = new Date()
    startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)
  }

  const [sales, expenses, cashShift] = await Promise.all([
    prisma.sale.findMany({
      where: { storeId, createdAt: { gte: startOfDay, lte: endOfDay } },
      select: {
        total: true,
        paymentType: true,
        paymentStatus: true,
      },
    }),
    prisma.expense.findMany({
      where: { storeId, createdAt: { gte: startOfDay, lte: endOfDay } },
      select: { amount: true },
    }),
    prisma.cashShift.findFirst({
      where: { storeId, status: "OPEN" },
      select: { startingCash: true },
    }),
  ])

  const totalSales = sales.reduce((acc, s) => acc + s.total, 0)
  const cashSales = sales.filter(s => s.paymentType === "CASH").reduce((acc, s) => acc + s.total, 0)
  const cardSales = sales.filter(s => s.paymentType === "CARD").reduce((acc, s) => acc + s.total, 0)
  const transferSales = sales.filter(s => s.paymentType === "TRANSFER").reduce((acc, s) => acc + s.total, 0)
  const pendingSales = sales.filter(s => s.paymentStatus === "PENDING").reduce((acc, s) => acc + s.total, 0)
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)
  const profit = totalSales - totalExpenses

  return {
    totalSales,
    cashSales,
    cardSales,
    transferSales,
    pendingSales,
    totalExpenses,
    profit,
    startingCash: cashShift?.startingCash || 0,
    date: endOfDay.toISOString().split("T")[0],
  }
}