import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const storeId = request.nextUrl.searchParams.get("storeId")

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 })
  }

  const sale = await prisma.sale.findUnique({
    where: { 
      id,
      storeId,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    },
    include: {
      items: {
        include: {
          product: {
            select: { name: true }
          }
        }
      },
      customer: {
        select: { name: true }
      }
    }
  })

  if (!sale) {
    return NextResponse.json(null)
  }

  return NextResponse.json(sale)
}