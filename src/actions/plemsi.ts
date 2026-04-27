"use server"

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type SendToPlemsiResult = {
  success: boolean
  message: string
  plemsiId?: string
  status?: string
}

export async function sendSaleToPlemsi(saleId: string): Promise<SendToPlemsiResult> {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
        store: true,
        items: { include: { product: true } },
        user: true
      }
    })

    if (!sale) {
      return { success: false, message: "Venta no encontrada" }
    }

    if (sale.invoiceStatus && sale.invoiceStatus !== "ERROR" && sale.invoiceStatus !== "REJECTED") {
      return { success: false, message: `Factura ya enviada (${sale.invoiceStatus})`, plemsiId: sale.plemsiId || undefined }
    }

    const plemsiApiKey = process.env.PLEMSI_API_KEY
    const plemsiApiSecret = process.env.PLEMSI_API_SECRET
    const plemsiCompanyId = process.env.PLEMSI_COMPANY_ID

    if (!plemsiApiKey || !plemsiApiSecret || !plemsiCompanyId) {
      return { success: false, message: "Plemsi no configurado. Configure las credenciales en variables de entorno." }
    }

    const baseUrl = process.env.PLEMSI_SANDBOX === "true"
      ? "https://api.sandbox.plemsi.com/v1"
      : "https://api.plemsi.com/v1"

    const customer = sale.customer
    const items = sale.items

    const invoiceData = {
      company_id: plemsiCompanyId,
      resolution: {
        prefix: "FAC",
        number: sale.invoiceNumber?.replace("FAC-", "") || sale.id.slice(-8)
      },
      customer: {
        identification: customer?.document || "222222222222",
        name: customer?.name || "Cliente Mostrador",
        phone: customer?.phone || "3000000000",
        email: customer?.email || "cliente@correo.com",
        address: customer?.address || "Sin dirección",
        type: customer?.document?.length === 10 ? "nit" : "citizen"
      },
      items: items.map(item => ({
        name: item.product.name,
        reference: item.product.sku || item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        iva_rate: 19,
        iva_amount: item.price * item.quantity * 0.19,
        total: item.price * item.quantity * 1.19
      })),
      payments: [{
        method: sale.paymentType === "CASH" ? "cash" :
          sale.paymentType === "CARD" ? "card" :
          sale.paymentType === "TRANSFER" ? "transfer" : "cash",
        value: sale.total
      }],
      totals: {
        subtotal: sale.total / 1.19,
        iva: sale.total * 0.19 / 1.19,
        total: sale.total
      }
    }

    const response = await fetch(`${baseUrl}/invoices`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${plemsiApiKey}:${plemsiApiSecret}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(invoiceData)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Plemsi error:", error)
      return { success: false, message: `Error de Plemsi: ${error}` }
    }

    const result = await response.json()

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        invoiceStatus: "SENT",
        plemsiId: result.id,
        sentAt: new Date()
      }
    })

    revalidatePath("/invoices")

    return {
      success: true,
      message: "Factura enviada a DIAN",
      plemsiId: result.id,
      status: result.status
    }
  } catch (error: any) {
    console.error("Error sending to Plemsi:", error)
    return { success: false, message: error.message || "Error al enviar a DIAN" }
  }
}

export async function checkPlemsiStatus(saleId: string): Promise<SendToPlemsiResult> {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId }
    })

    if (!sale) {
      return { success: false, message: "Venta no encontrada" }
    }

    if (!sale.plemsiId) {
      return { success: false, message: "Factura no enviada a Plemsi" }
    }

    const plemsiApiKey = process.env.PLEMSI_API_KEY
    const plemsiApiSecret = process.env.PLEMSI_API_SECRET

    if (!plemsiApiKey || !plemsiApiSecret) {
      return { success: false, message: "Plemsi no configurado" }
    }

    const baseUrl = process.env.PLEMSI_SANDBOX === "true"
      ? "https://api.sandbox.plemsi.com/v1"
      : "https://api.plemsi.com/v1"

    const response = await fetch(`${baseUrl}/invoices/${sale.plemsiId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${plemsiApiKey}:${plemsiApiSecret}`,
        "Accept": "application/json"
      }
    })

    if (!response.ok) {
      return { success: false, message: "Error al consultar estado" }
    }

    const plemsiStatus = await response.json()

    const updateData: any = {
      invoiceStatus: plemsiStatus.status?.toUpperCase()
    }

    if (plemsiStatus.status === "accepted") {
      updateData.acceptedAt = plemsiStatus.accepted_at ? new Date(plemsiStatus.accepted_at) : new Date()
    }
    if (plemsiStatus.status === "rejected") {
      updateData.rejectedAt = plemsiStatus.rejected_at ? new Date(plemsiStatus.rejected_at) : new Date()
      updateData.rejectionReason = plemsiStatus.rejection_reason || plemsiStatus.errors?.join(", ")
    }
    if (plemsiStatus.cufe) updateData.dianCufe = plemsiStatus.cufe
    if (plemsiStatus.qr_url) updateData.dianQrUrl = plemsiStatus.qr_url
    if (plemsiStatus.xml_id) updateData.dianXmlId = plemsiStatus.xml_id

    await prisma.sale.update({
      where: { id: saleId },
      data: updateData
    })

    revalidatePath("/invoices")

    return {
      success: true,
      message: "Estado actualizado",
      status: plemsiStatus.status
    }
  } catch (error: any) {
    console.error("Error checking Plemsi status:", error)
    return { success: false, message: error.message || "Error al consultar estado" }
  }
}