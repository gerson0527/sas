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

/** Sin secretos — útil para Vercel (Runtime logs): misma función en cada authorize. */
export function getDatabaseConfigSnapshot(): {
  dbTarget: string
  uriUser?: string
  databaseName?: string
  hasDatabaseUrl: boolean
  nodeEnv?: string
  vercelEnv?: string
  vercelUrl?: string
} {
  const raw = process.env.DATABASE_URL
  const base = {
    hasDatabaseUrl: Boolean(raw),
    dbTarget: getDatabaseUrlTarget(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  }
  if (!raw) return base
  try {
    const normalized = /^postgresql:/i.test(raw) ? raw.replace(/^postgresql:/i, "postgres:") : raw
    const u = new URL(normalized)
    return {
      ...base,
      uriUser: u.username || undefined,
      databaseName: decodeURIComponent(u.pathname.replace(/^\//, "") || "postgres"),
    }
  } catch {
    return base
  }
}

/** Se ejecuta al cargar el módulo; en algunos bundles serverless puede no aparecer en logs. Preferir también `getDatabaseConfigSnapshot` en rutas API. */
function logPrismaDbSourceOnce(): void {
  const snap = getDatabaseConfigSnapshot()
  console.warn("[prisma] init DATABASE_URL snapshot", snap)
}

logPrismaDbSourceOnce()
