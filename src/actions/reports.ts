"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type SalesReportFilter = {
  startDate?: Date
  endDate?: Date
  userId?: string
  customerId?: string
  category?: string
}

export async function getSalesReport(storeId: string, filter: SalesReportFilter = {}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const where: any = { storeId }
  if (filter.startDate) where.createdAt = { ...where.createdAt, gte: filter.startDate }
  if (filter.endDate) where.createdAt = { ...where.createdAt, lte: filter.endDate }
  if (filter.userId) where.userId = filter.userId
  if (filter.customerId) where.customerId = filter.customerId

  const [sales, , products] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
        items: {
          include: {
            product: {
              select: { name: true, categoryId: true, category: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.aggregate({
      where,
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        price: true,
        cost: true,
      },
    }),
  ])

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0)
  const totalTransactions = sales.length

  const byPaymentType = sales.reduce((acc, s) => {
    acc[s.paymentType] = (acc[s.paymentType] || 0) + s.total
    return acc
  }, {} as Record<string, number>)

  const byUser = sales.reduce((acc, s) => {
    const name = s.user?.name || "Desconocido"
    acc[name] = acc[name] || { count: 0, total: 0 }
    acc[name].count++
    acc[name].total += s.total
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  const topProducts = sales
    .flatMap(s => s.items.map(item => ({
      productId: item.productId,
      productName: item.product.name,
      categoryName: item.product.category?.name || "Sin categoría",
      quantity: item.quantity,
      revenue: item.price * item.quantity,
    })))
    .reduce((acc, item) => {
      const key = item.productId
      if (!acc[key]) {
        acc[key] = { ...item, count: 0 }
      }
      acc[key].count += item.quantity
      acc[key].revenue += item.revenue
      return acc
    }, {} as Record<string, any>)
  const topProductsList = Object.values(topProducts)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10)

  const byDay = sales.reduce((acc, s) => {
    const day = s.createdAt.toISOString().split("T")[0]
    if (!acc[day]) acc[day] = { count: 0, total: 0 }
    acc[day].count++
    acc[day].total += s.total
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  const profitMargin = products.reduce((acc, p) => {
    const sold = sales.flatMap(s => s.items.filter(i => i.productId === p.id))
    const revenue = sold.reduce((a, i) => a + i.price * i.quantity, 0)
    const costTotal = sold.reduce((a, i) => a + (p.cost || 0) * i.quantity, 0)
    return acc + (revenue - costTotal)
  }, 0)

  return {
    sales,
    totalRevenue,
    totalTransactions,
    byPaymentType,
    byUser,
    topProducts: topProductsList,
    byDay,
    profitMargin,
  }
}

export async function getReportData(storeId: string, filter: { startDate?: string; endDate?: string } = {}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const now = new Date()

  let startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
  let endOfPeriod = now

  if (filter.startDate) {
    startOfPeriod = new Date(filter.startDate + "T00:00:00")
  }
  if (filter.endDate) {
    endOfPeriod = new Date(filter.endDate + "T23:59:59.999")
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const [monthly, weekly, today] = await Promise.all([
    getSalesReport(storeId, { startDate: startOfPeriod, endDate: endOfPeriod }),
    getSalesReport(storeId, { startDate: startOfWeek, endDate: now }),
    getSalesReport(storeId, { startDate: startOfToday, endDate: now }),
  ])

  return { monthly, weekly, today }
}

export type ReturnFilter = {
  startDate?: string
  endDate?: string
  type?: string
}

export async function getReturnsReport(storeId: string, filter: ReturnFilter = {}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  
  let startDate = startOfMonth
  let endDate = now

  if (filter.startDate) {
    startDate = new Date(filter.startDate + "T00:00:00")
  }
  if (filter.endDate) {
    endDate = new Date(filter.endDate + "T23:59:59.999")
  }

  const [monthly, weekly, today] = await Promise.all([
    getSalesReport(storeId, { startDate: startOfMonth, endDate: now }),
    getSalesReport(storeId, { startDate: startOfWeek, endDate: now }),
    getSalesReport(storeId, { startDate: startOfToday, endDate: now }),
  ])

  const whereBase = {
    storeId,
    createdAt: { gte: startDate, lte: endDate }
  }

  const [saleReturns, supplierReturns] = await Promise.all([
    filter.type === "SUPPLIERS" ? Promise.resolve([]) : prisma.sale.findMany({
      where: { ...whereBase, isReturn: true },
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } }
      },
      orderBy: { createdAt: "desc" }
    }),
    filter.type === "SALES" ? Promise.resolve([]) : prisma.purchase.findMany({
      where: { ...whereBase, isReturn: true },
      include: {
        user: { select: { name: true } },
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } }
      },
      orderBy: { createdAt: "desc" }
    })
  ])

  const totalSaleReturns = saleReturns.reduce((acc, r) => acc + Math.abs(r.total), 0)
  const totalSupplierReturns = supplierReturns.reduce((acc, r) => acc + Math.abs(r.total), 0)

  return {
    sales: { monthly, weekly, today },
    saleReturns: {
      items: saleReturns,
      total: totalSaleReturns,
      count: saleReturns.length
    },
    supplierReturns: {
      items: supplierReturns,
      total: totalSupplierReturns,
      count: supplierReturns.length
    }
  }
}

export type InvoiceFilter = {
  startDate?: Date
  endDate?: Date
  status?: string
  paymentType?: string
  customerId?: string
}

export async function getInvoicesReport(storeId: string, filter: InvoiceFilter = {}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const where: any = { storeId }

  if (filter.startDate) {
    const startDateStr = String(filter.startDate)
    where.createdAt = { gte: new Date(startDateStr + "T00:00:00") }
  }
  if (filter.endDate) {
    const endDateStr = String(filter.endDate)
    where.createdAt = { ...where.createdAt, lte: new Date(endDateStr + "T23:59:59.999") }
  }
  if (filter.status && filter.status !== "ALL") {
    where.paymentStatus = filter.status
  }
  if (filter.paymentType && filter.paymentType !== "ALL") {
    where.paymentType = filter.paymentType
  }
  if (filter.customerId) {
    where.customerId = filter.customerId
  }

  const invoices = await prisma.sale.findMany({
    where,
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      paymentType: true,
      paymentStatus: true,
      createdAt: true,
      user: { select: { name: true } },
      customer: { select: { name: true, document: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true } }
        }
      },
      invoiceStatus: true,
      plemsiId: true,
      dianCufe: true,
      dianQrUrl: true
    },
    orderBy: { createdAt: "desc" }
  })

  const totals = invoices.reduce((acc, inv) => ({
    subtotal: acc.subtotal + (inv.total / 1.19),
    iva: acc.iva + (inv.total * 0.19 / 1.19),
    total: acc.total + inv.total
  }), { subtotal: 0, iva: 0, total: 0 })

  const byPaymentType = invoices.reduce((acc, inv) => {
    acc[inv.paymentType] = (acc[inv.paymentType] || 0) + inv.total
    return acc
  }, {} as Record<string, number>)

  const byStatus = invoices.reduce((acc, inv) => {
    acc[inv.paymentStatus] = (acc[inv.paymentStatus] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    invoices,
    totals,
    byPaymentType,
    byStatus,
    count: invoices.length
  }
}