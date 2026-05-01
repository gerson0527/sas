import { NextResponse } from "next/server"
import { getDatabaseConfigSnapshot } from "@/lib/prisma"

export const runtime = "nodejs"

/**
 * Solo para depuración. Activa en Vercel `ALLOW_DB_SNAPSHOT=1` (Production si aplica).
 * Quita la variable cuando termines — no pongas datos sensibles en la respuesta.
 */
export async function GET() {
  if (process.env.ALLOW_DB_SNAPSHOT !== "1") {
    return NextResponse.json({ error: "Not enabled" }, { status: 404 })
  }

  try {
    return NextResponse.json({
      ok: true,
      snapshot: getDatabaseConfigSnapshot(),
    })
  } catch (e) {
    console.error("[debug/db-snapshot]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
