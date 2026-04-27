"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { createRole, updateRole } from "@/actions/roles"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AVAILABLE_PERMISSIONS } from "@/lib/constants"

type ExistingRole = {
  id: string
  name: string
  permissions: { name: string }[]
}

export function RoleForm({ storeId, existingRole, isEdit }: { storeId: string; existingRole?: ExistingRole; isEdit?: boolean }) {
  const [open, setOpen] = useState(false)

  const buttonStyle = isEdit 
    ? "text-[9px] uppercase tracking-widest text-muted-foreground hover:bg-destructive/10 px-2 py-1 border border-border/50 rounded-none w-auto"
    : "inline-flex shrink-0 items-center justify-center border border-primary bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-none uppercase tracking-widest font-bold text-sm transition-colors"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className={buttonStyle} />
        }
      >
        {existingRole ? "EDITAR" : "NUEVO ROL"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-none border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest font-bold text-primary">
            {existingRole ? "EDITAR ROL" : "CREAR ROL PERSONALIZADO"}
          </DialogTitle>
        </DialogHeader>
        <RoleCreateForm 
          storeId={storeId} 
          existingRole={existingRole}
          onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  )
}

function RoleCreateForm({ storeId, existingRole, onSuccess }: { storeId: string; existingRole?: ExistingRole; onSuccess: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const permissions = formData.getAll("permissions") as string[]

    if (!name) {
      setError("El nombre del rol es obligatorio")
      setLoading(false)
      return
    }

    if (permissions.length === 0) {
      setError("Selecciona al menos un permiso")
      setLoading(false)
      return
    }

    try {
      if (existingRole) {
        await updateRole(existingRole.id, name, permissions)
        toast.success("ROL ACTUALIZADO")
      } else {
        await createRole(storeId, name, permissions)
        toast.success("ROL CREADO")
      }
      router.refresh()
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el rol")
    } finally {
      setLoading(false)
    }
  }

  const existingPerms = existingRole?.permissions.map(p => p.name) || []

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">NOMBRE DEL ROL</label>
        <input
          name="name"
          required
          defaultValue={existingRole?.name || ""}
          placeholder="Ej: Cajero, Gerente..."
          className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">PERMISOS</label>
        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
          {AVAILABLE_PERMISSIONS.map(perm => (
            <label key={perm.name} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="permissions"
                value={perm.name}
                defaultChecked={existingPerms.includes(perm.name)}
                className="mt-0.5 border border-border rounded-none bg-card"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase">{perm.label}</span>
                <span className="text-[9px] text-muted-foreground">{perm.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-[10px] uppercase tracking-widest text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full rounded-none uppercase tracking-widest font-bold h-10">
        {loading ? "GUARDANDO..." : existingRole ? "ACTUALIZAR ROL" : "CREAR ROL"}
      </Button>
    </form>
  )
}