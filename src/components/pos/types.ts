export type SalesBreakdown = {
  cashSales: number
  cardSales: number
  transferSales: number
  pendingSales: number
  totalSales: number
  transactionCount: number
}

export type CashRegister = {
  id: string
  name: string
  location: string | null
}

export type Shift = {
  id: string
  status: string
  startingCash: number
  expectedCash: number | null
  actualCash: number | null
  difference: number | null
  startTime: string | Date
  endTime?: string | Date | null
  userName?: string | null
  closedByUserName?: string | null
  cashRegisterName?: string | null
  salesBreakdown?: SalesBreakdown
  isPreviousDay?: boolean
}

export type Product = {
  id: string
  name: string
  sku: string | null
  price: number
  stock: number
  categoryId: string | null
  category?: { name: string } | null
}

export type Customer = {
  id: string
  name: string
  document: string | null
  balance: number
  creditLimit: number
}

export type Category = {
  id: string
  name: string
}