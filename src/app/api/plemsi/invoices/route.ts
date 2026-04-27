import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPlemsiInvoice, isPlemsiConfigured, getPlemsiInvoiceStatus, updateSaleStatusFromPlemsi } from "@/lib/plemsi"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isPlemsiConfigured()) {
      return NextResponse.json({ 
        error: "Plemsi no configurado",
        message: "Configure las credenciales de Plemsi en las variables de entorno"
      }, { status: 400 })
    }

    const body = await request.json()
    const { saleId } = body

    if (!saleId) {
      return NextResponse.json({ error: "saleId requerido" }, { status: 400 })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId }
    })

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    if (sale.invoiceStatus && sale.invoiceStatus !== "ERROR") {
      return NextResponse.json({ 
        error: "Factura ya enviada",
        status: sale.invoiceStatus
      }, { status: 400 })
    }

    const result = await createPlemsiInvoice(saleId)

    if (!result) {
      return NextResponse.json({ 
        error: "Error al crear factura electrónica"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      plemsiId: result.id,
      status: result.status,
      message: "Factura electrónica creada exitosamente"
    })
  } catch (error: any) {
    console.error("Error creating Plemsi invoice:", error)
    return NextResponse.json({ 
      error: error.message || "Error al crear factura"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const saleId = searchParams.get("saleId")

    if (!saleId) {
      return NextResponse.json({ error: "saleId requerido" }, { status: 400 })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId }
    })

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    if (!sale.plemsiId) {
      return NextResponse.json({ 
        error: "Factura no enviada a Plemsi",
        invoiceStatus: sale.invoiceStatus
      }, { status: 400 })
    }

    const plemsiStatus = await getPlemsiInvoiceStatus(sale.plemsiId)

    if (!plemsiStatus) {
      return NextResponse.json({
        invoiceStatus: sale.invoiceStatus,
        plemsiId: sale.plemsiId,
        message: "No se pudo obtener estado de Plemsi"
      })
    }

    await updateSaleStatusFromPlemsi(saleId, plemsiStatus)

    return NextResponse.json({
      invoiceStatus: plemsiStatus.status,
      plemsiId: plemsiStatus.id,
      cufe: plemsiStatus.cufe,
      qrUrl: plemsiStatus.qr_url,
      sentAt: plemsiStatus.sent_at,
      acceptedAt: plemsiStatus.accepted_at,
      rejectedAt: plemsiStatus.rejected_at,
      rejectionReason: plemsiStatus.rejection_reason
    })
  } catch (error: any) {
    console.error("Error getting Plemsi status:", error)
    return NextResponse.json({ 
      error: error.message || "Error al consultar estado"
    }, { status: 500 })
  }
}