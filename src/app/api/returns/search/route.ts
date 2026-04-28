import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ returns: [] }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""

  if (!query.trim()) {
    return NextResponse.json({ returns: [] })
  }

  try {
    const searchTerm = query.toLowerCase()

    const saleReturns = await prisma.sale.findMany({
      where: {
        returnReason: { not: null },
        OR: [
          { id: { contains: searchTerm } },
          { returnReason: { contains: searchTerm } },
          { 
            customer: { 
              name: { contains: searchTerm } 
            } 
          }
        ]
      },
      select: {
        id: true,
        total: true,
        returnReason: true,
        createdAt: true,
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    const supplierReturns = await prisma.purchase.findMany({
      where: {
        returnReason: { not: null },
        OR: [
          { id: { contains: searchTerm } },
          { returnReason: { contains: searchTerm } },
          { 
            supplier: { 
              name: { contains: searchTerm } 
            } 
          }
        ]
      },
      select: {
        id: true,
        total: true,
        returnReason: true,
        createdAt: true,
        supplier: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    const returns = [
      ...saleReturns.map(s => ({
        type: "VENTA",
        id: s.id,
        total: s.total,
        returnReason: s.returnReason,
        createdAt: s.createdAt,
        customerName: s.customer?.name,
        supplierName: null
      })),
      ...supplierReturns.map(p => ({
        type: "PROVEEDOR",
        id: p.id,
        total: p.total,
        returnReason: p.returnReason,
        createdAt: p.createdAt,
        customerName: null,
        supplierName: p.supplier?.name
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ returns: returns.slice(0, 50) })
  } catch (error) {
    console.error("Returns search error:", error)
    return NextResponse.json({ returns: [] }, { status: 500 })
  }
}