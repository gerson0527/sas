"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `FAC-${timestamp.slice(-5)}${random}`
}

export async function createSale(
  storeId: string,
  items: { productId: string; quantity: number; price: number }[],
  customerId?: string,
  paymentStatus: "PAID" | "PENDING" = "PAID",
  shiftId?: string
) {
  const session = await auth()
  const userId = session?.user?.id
  
  if (!userId) throw new Error("Unauthorized")

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const invoiceNumber = generateInvoiceNumber()

  const sale = await prisma.sale.create({
    data: {
      invoiceNumber,
      total,
      paymentType: "CASH",
      paymentStatus,
      storeId,
      userId,
      customerId: customerId || null,
      shiftId: shiftId || null,
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }
  })

  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    })
  }

  revalidatePath("/pos")
  return sale
}

export async function openCashShift(storeId: string, startingCash: number, registerId?: string) {
  const session = await auth()
  const userId = session?.user?.id
  
  if (!userId) throw new Error("Unauthorized")

  const shift = await prisma.cashShift.create({
    data: {
      status: "OPEN",
      startingCash,
      storeId,
      userId,
      cashRegisterId: registerId || null
    }
  })

  revalidatePath("/pos")
  return shift
}

export async function closeCashShift(shiftId: string, actualCash: number) {
  const session = await auth()
  const userId = session?.user?.id
  
  if (!userId) throw new Error("Unauthorized")

  const shift = await prisma.cashShift.findUnique({
    where: { id: shiftId },
    include: { sales: true }
  })

  if (!shift) throw new Error("Turno no encontrado")
  if (shift.status === "CLOSED") throw new Error("Caja ya cerrada")

  const storeId = shift.storeId
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const saleReturns = await prisma.sale.findMany({
    where: {
      storeId,
      isReturn: true,
      createdAt: { gte: startOfToday, lte: endOfToday }
    },
    select: { id: true, total: true, paymentType: true, returnReason: true, createdAt: true }
  })

  const supplierReturns = await prisma.purchase.findMany({
    where: {
      storeId,
      isReturn: true,
      createdAt: { gte: startOfToday, lte: endOfToday }
    },
    select: { id: true, total: true, returnReason: true, notes: true, createdAt: true }
  })

  const cashSalesTotal = shift.sales.filter((s: any) => s.paymentType === "CASH").reduce((sum: number, s: any) => sum + s.total, 0)
  const cardSalesTotal = shift.sales.filter((s: any) => s.paymentType === "CARD").reduce((sum: number, s: any) => sum + s.total, 0)
  const transferSalesTotal = shift.sales.filter((s: any) => s.paymentType === "TRANSFER").reduce((sum: number, s: any) => sum + s.total, 0)
  const totalSales = shift.sales.reduce((sum: number, s: any) => sum + s.total, 0)
  const expectedCash = shift.startingCash + cashSalesTotal
  const difference = actualCash - expectedCash

  await prisma.cashShift.update({
    where: { id: shiftId },
    data: {
      status: "CLOSED",
      endTime: new Date(),
      expectedCash,
      actualCash,
      difference,
      closedByUserId: userId,
      totalCashSales: cashSalesTotal,
      totalCardSales: cardSalesTotal,
      totalTransferSales: transferSalesTotal,
      totalSales,
    }
  })

  revalidatePath("/pos")
  revalidatePath("/finance")
  return { 
    success: true, 
    expectedCash, 
    actualCash, 
    difference,
    saleReturns: saleReturns.map((r: any) => ({
      id: r.id,
      total: Math.abs(r.total),
      paymentType: r.paymentType,
      reason: r.returnReason,
      createdAt: r.createdAt
    })),
    supplierReturns: supplierReturns.map((r: any) => ({
      id: r.id,
      total: Math.abs(r.total),
      reason: r.returnReason || r.notes,
      createdAt: r.createdAt
    }))
  }
}

export async function getCurrentShift(storeId: string) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  let shift = await prisma.cashShift.findFirst({
    where: { 
      storeId,
      startTime: { gte: startOfToday, lte: endOfToday }
    },
    include: {
      sales: true,
      user: { select: { name: true } },
      closedByUser: { select: { name: true } },
      cashRegister: { select: { name: true } },
    },
    orderBy: { startTime: "desc" }
  })

  if (!shift) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)

    shift = await prisma.cashShift.findFirst({
      where: { 
        storeId,
        status: "OPEN",
        startTime: { gte: startOfYesterday, lte: endOfYesterday }
      },
      include: {
        sales: true,
        user: { select: { name: true } },
        closedByUser: { select: { name: true } },
        cashRegister: { select: { name: true } },
      },
      orderBy: { startTime: "desc" }
    })
  }
   
  if (!shift) return null

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const shiftDate = new Date(shift.startTime.getFullYear(), shift.startTime.getMonth(), shift.startTime.getDate())
  const isPreviousDay = shiftDate < today

  const sales = shift.sales
  const cashSales = sales.filter((s: any) => s.paymentType === "CASH").reduce((sum: number, s: any) => sum + s.total, 0)
  const cardSales = sales.filter((s: any) => s.paymentType === "CARD").reduce((sum: number, s: any) => sum + s.total, 0)
  const transferSales = sales.filter((s: any) => s.paymentType === "TRANSFER").reduce((sum: number, s: any) => sum + s.total, 0)
  const pendingSales = sales.filter((s: any) => s.paymentStatus === "PENDING").reduce((sum: number, s: any) => sum + s.total, 0)
  const totalSales = sales.reduce((sum: number, s: any) => sum + s.total, 0)
  const transactionCount = sales.length
  
  return {
    id: shift.id,
    status: shift.status,
    startingCash: shift.startingCash,
    expectedCash: shift.startingCash + cashSales,
    actualCash: shift.actualCash,
    difference: shift.difference,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime?.toISOString(),
    userName: shift.user?.name,
    closedByUserName: shift.closedByUser?.name,
    cashRegisterName: shift.cashRegister?.name,
    isPreviousDay,
    salesBreakdown: {
      cashSales,
      cardSales,
      transferSales,
      pendingSales,
      totalSales,
      transactionCount,
    }
  }
}

export async function createSaleReturn(
  originalSaleId: string,
  items: { productId: string, quantity: number, price: number }[],
  reason: string,
  refundMethod: "CASH" | "CREDIT" = "CASH"
) {
  const session = await auth()
  const userId = session?.user?.id
  
  if (!userId) throw new Error("Unauthorized")

  const originalSale = await prisma.sale.findUnique({
    where: { id: originalSaleId },
    include: { items: true }
  })

  if (!originalSale) throw new Error("Venta no encontrada")

  const today = new Date()
  const saleDate = new Date(originalSale.createdAt)
  const isSameDay = saleDate.toDateString() === today.toDateString()
  
  if (!isSameDay) throw new Error("Solo se pueden devolver ventas del día actual")

  const returnTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  await prisma.$transaction(async (tx: any) => {
    const saleReturn = await tx.sale.create({
      data: {
        total: -returnTotal,
        paymentType: refundMethod === "CASH" ? "CASH" : "CARD",
        paymentStatus: "PAID",
        isReturn: true,
        returnReason: reason,
        originalSaleId,
        refundAmount: returnTotal,
        storeId: originalSale.storeId,
        userId,
        shiftId: originalSale.shiftId
      }
    })

    await tx.saleItem.createMany({
      data: items.map(item => ({
        saleId: saleReturn.id,
        productId: item.productId,
        quantity: -item.quantity,
        price: item.price
      }))
    })

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      })
    }
  })

  revalidatePath("/pos")
  return { success: true }
}