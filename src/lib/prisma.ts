import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

/** Solo para logs de diagnóstico (hostname de Postgres), sin secretos */
export function getDatabaseHostHint(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) return "(DATABASE_URL ausente)"
  try {
    const normalized = /^postgresql:/i.test(raw) ? raw.replace(/^postgresql:/i, "postgres:") : raw
    return new URL(normalized).hostname
  } catch {
    return "(DATABASE_URL inválida)"
  }
}
