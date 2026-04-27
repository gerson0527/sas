"use client"

import { useRouter } from "next/navigation"
import { deleteRole } from "@/actions/roles"
import { alert } from "@/lib/alert"

export function RoleActions({ role }: { role: any }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`¿ELIMINAR EL ROL "${role.name}"?`)) return
    try {
      await deleteRole(role.id)
      router.refresh()
      alert.success("ROL ELIMINADO", "El rol fue eliminado del sistema.")
    } catch (e: any) {
      alert.error("NO SE PUDO ELIMINAR", e.message || "Hay usuarios con este rol.")
    }
  }

  return (
    <button 
      onClick={handleDelete}
      className="text-[9px] uppercase tracking-widest text-destructive hover:bg-destructive/10 px-2 py-1 border border-destructive/30"
    >
      ELIMINAR
    </button>
  )
}