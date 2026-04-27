import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, document, email, phone, address, creditLimit, storeId } = body

  if (!name || !storeId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      document: document || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      creditLimit: creditLimit || 0,
      storeId,
      balance: 0
    }
  })

  return NextResponse.json(customer)
}