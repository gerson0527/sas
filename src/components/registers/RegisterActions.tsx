"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteRegister, updateRegister } from "@/actions/registers"
import { alert } from "@/lib/alert"

type Register = {
  id: string
  name: string
  location: string | null
  isActive: boolean
}

export default function RegisterActions({ register, storeId }: { register: Register; storeId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(register.name)
  const [location, setLocation] = useState(register.location || "")
  const [isActive, setIsActive] = useState(register.isActive)

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setIsDeleting(true)
    try {
      await updateRegister(register.id, { name, location, isActive })
      alert.success("Caja actualizada")
      router.refresh()
      setOpen(false)
    } catch (error) {
      alert.error("Error al actualizar")
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta caja?")) return
    setIsDeleting(true)
    try {
      await deleteRegister(register.id)
      alert.success("Caja eliminada")
      router.refresh()
    } catch (error) {
      alert.error("Error al eliminar")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={
          <button className="rounded-none uppercase tracking-widest text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 py-1">
            EDITAR
          </button>
        } />
        <DialogContent className="rounded-none border-border bg-background sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-primary">
              EDITAR CAJA
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">NOMBRE</label>
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">UBICACIÓN</label>
              <input 
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase"
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id={`active-${register.id}`}
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="border border-border"
              />
              <label htmlFor={`active-${register.id}`} className="text-xs uppercase">
                Caja activa
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleDelete} disabled={isDeleting} className="flex-1 rounded-none uppercase font-bold text-destructive">
                ELIMINAR
              </Button>
              <Button type="submit" disabled={isDeleting} className="flex-1 rounded-none uppercase font-bold">
                GUARDAR
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}