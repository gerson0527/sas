import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const PLEMSI_BASE_URL = process.env.PLEMSI_SANDBOX === "true" 
  ? "https://api.sandbox.plemsi.com/v1"
  : "https://api.plemsi.com/v1"

const PLEMSI_API_KEY = process.env.PLEMSI_API_KEY || ""
const PLEMSI_API_SECRET = process.env.PLEMSI_API_SECRET || ""
const PLEMSI_COMPANY_ID = process.env.PLEMSI_COMPANY_ID || ""

function getAuthHeaders() {
  return {
    "Authorization": `Bearer ${PLEMSI_API_KEY}:${PLEMSI_API_SECRET}`,
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
}

export type PlemsiInvoiceStatus = {
  id: string
  number: string
  prefix: string
  status: "draft" | "pending" | "sent" | "accepted" | "rejected" | "error"
  cufe?: string
  qr_url?: string
  xml_id?: string
  sent_at?: string
  accepted_at?: string
  rejected_at?: string
  rejection_reason?: string
  errors?: string[]
}

export async function createPlemsiInvoice(saleId: string): Promise<PlemsiInvoiceStatus | null> {
  if (!PLEMSI_API_KEY || !PLEMSI_API_SECRET) {
    console.error("Plemsi credentials not configured")
    return null
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      store: true,
      items: {
        include: { product: true }
      },
      user: true
    }
  })

  if (!sale) {
    throw new Error("Venta no encontrada")
  }

  const customer = sale.customer
  const items = sale.items

  const invoiceData = {
    company_id: PLEMSI_COMPANY_ID,
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
    payments: [
      {
        method: sale.paymentType === "CASH" ? "cash" : 
                sale.paymentType === "CARD" ? "card" : 
                sale.paymentType === "TRANSFER" ? "transfer" : "cash",
        value: sale.total
      }
    ],
    totals: {
      subtotal: sale.total / 1.19,
      iva: sale.total * 0.19 / 1.19,
      total: sale.total
    }
  }

  try {
    const response = await fetch(`${PLEMSI_BASE_URL}/invoices`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(invoiceData)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Plemsi error:", error)
      throw new Error(`Error al crear factura en Plemsi: ${error}`)
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

    return result as PlemsiInvoiceStatus
  } catch (error) {
    console.error("Error creating Plemsi invoice:", error)
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        invoiceStatus: "ERROR"
      }
    })
    throw error
  }
}

export async function getPlemsiInvoiceStatus(plemsiId: string): Promise<PlemsiInvoiceStatus | null> {
  if (!PLEMSI_API_KEY || !PLEMSI_API_SECRET) {
    return null
  }

  try {
    const response = await fetch(`${PLEMSI_BASE_URL}/invoices/${plemsiId}`, {
      method: "GET",
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      console.error("Error fetching Plemsi invoice:", await response.text())
      return null
    }

    return await response.json() as PlemsiInvoiceStatus
  } catch (error) {
    console.error("Error getting Plemsi invoice:", error)
    return null
  }
}

export async function updateSaleStatusFromPlemsi(saleId: string, plemsiStatus: PlemsiInvoiceStatus) {
  const updateData: any = {}

  switch (plemsiStatus.status) {
    case "accepted":
      updateData.invoiceStatus = "ACCEPTED"
      updateData.acceptedAt = plemsiStatus.accepted_at ? new Date(plemsiStatus.accepted_at) : new Date()
      break
    case "rejected":
      updateData.invoiceStatus = "REJECTED"
      updateData.rejectedAt = plemsiStatus.rejected_at ? new Date(plemsiStatus.rejected_at) : new Date()
      updateData.rejectionReason = plemsiStatus.rejection_reason || plemsiStatus.errors?.join(", ")
      break
    case "error":
      updateData.invoiceStatus = "ERROR"
      updateData.rejectionReason = plemsiStatus.errors?.join(", ")
      break
  }

  if (plemsiStatus.cufe) updateData.dianCufe = plemsiStatus.cufe
  if (plemsiStatus.qr_url) updateData.dianQrUrl = plemsiStatus.qr_url
  if (plemsiStatus.xml_id) updateData.dianXmlId = plemsiStatus.xml_id

  await prisma.sale.update({
    where: { id: saleId },
    data: updateData
  })
}

export function isPlemsiConfigured(): boolean {
  return !!(PLEMSI_API_KEY && PLEMSI_API_SECRET && PLEMSI_COMPANY_ID)
}