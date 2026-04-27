import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateSaleStatusFromPlemsi } from "@/lib/plemsi"

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-plemsi-signature")
    
    const body = await request.json()
    
    const { 
      event, 
      invoice_id, 
      status, 
      cufe, 
      qr_url, 
      xml_id, 
      sent_at, 
      accepted_at, 
      rejected_at, 
      rejection_reason,
      errors 
    } = body

    console.log("Plemsi webhook received:", { event, invoice_id, status })

    if (!invoice_id) {
      return NextResponse.json({ error: "invoice_id requerido" }, { status: 400 })
    }

    const sale = await prisma.sale.findFirst({
      where: { plemsiId: invoice_id }
    })

    if (!sale) {
      console.error("Sale not found for plemsiId:", invoice_id)
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    const plemsiStatus = {
      id: invoice_id,
      number: sale.invoiceNumber || "",
      prefix: "FAC",
      status: status || event,
      cufe,
      qr_url,
      xml_id,
      sent_at,
      accepted_at,
      rejected_at,
      rejection_reason,
      errors
    }

    await updateSaleStatusFromPlemsi(sale.id, plemsiStatus)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error processing Plemsi webhook:", error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}