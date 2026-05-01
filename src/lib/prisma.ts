import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

/**
 * Host y puerto efectivos de `DATABASE_URL` (sin credenciales).
 * Si ves `db.*.supabase.co:5432` en Vercel, sigues usando la URI directa;
 * para serverless suele ir el pooler `:6543` y host `*.pooler.supabase.com`.
 */
export function getDatabaseUrlTarget(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) return "(DATABASE_URL ausente)"
  try {
    const normalized = /^postgresql:/i.test(raw) ? raw.replace(/^postgresql:/i, "postgres:") : raw
    const u = new URL(normalized)
    const port = u.port || "5432"
    return `${u.hostname}:${port}`
  } catch {
    return "(DATABASE_URL inválida)"
  }
}
