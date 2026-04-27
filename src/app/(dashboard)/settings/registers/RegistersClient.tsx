"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createRegister, updateRegister, deleteRegister } from "@/actions/registers"
import { alert } from "@/lib/alert"

type Register = {
  id: string
  name: string
  location: string | null
  isActive: boolean
  _count: { cashShifts: number }
}

export function RegistersClient({ 
  storeId, 
  registers: initialRegisters 
}: { 
  storeId: string
  registers: Register[]
}) {
  const router = useRouter()
  const [registers, setRegisters] = useState(initialRegisters)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const created = await createRegister(storeId, {
        name: formData.get("name") as string,
        location: formData.get("location") as string
      })
      alert.success("CAJA CREADA")
      setOpen(false)
      setRegisters(prev => [...prev, { ...created, _count: { cashShifts: 0 } }])
      router.refresh()
    } catch (error: any) {
      alert.error(error.message || "ERROR AL CREAR")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(registerId: string) {
    if (!confirm("¿ELIMINAR ESTA CAJA?")) return
    
    setLoading(true)
    try {
      await deleteRegister(registerId)
      alert.success("CAJA ELIMINADA")
      setRegisters(prev => prev.filter(r => r.id !== registerId))
      router.refresh()
    } catch (error: any) {
      alert.error(error.message || "ERROR AL ELIMINAR")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">CAJAS REGISTRADAS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Gestionar cajas físicas de la tienda
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-primary bg-primary/10 hover:bg-primary/20 text-primary">
            NUEVA CAJA
          </DialogTrigger>
          <DialogContent className="rounded-none border-border bg-background sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">
                CREAR CAJA
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">NOMBRE DE LA CAJA</label>
                <input 
                  name="name" 
                  required
                  placeholder="Caja Principal, Caja 2, etc."
                  className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">UBICACIÓN (OPCIONAL)</label>
                <input 
                  name="location" 
                  placeholder="Entrada, Piso 2, etc."
                  className="w-full h-10 bg-card border border-border rounded-none px-3 text-xs uppercase"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-none uppercase tracking-widest font-bold h-10">
                {loading ? "CREANDO..." : "CREAR CAJA"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border bg-card/30 rounded-none overflow-hidden">
        <table className="w-full text-left text-sm font-mono">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border tracking-widest">
            <tr>
              <th className="px-4 py-3 font-medium">NOMBRE</th>
              <th className="px-4 py-3 font-medium">UBICACIÓN</th>
              <th className="px-4 py-3 font-medium text-center">TURNOS</th>
              <th className="px-4 py-3 font-medium text-center">ESTADO</th>
              <th className="px-4 py-3 font-medium text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {registers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs uppercase tracking-widest text-muted-foreground/50">
                  NO HAY CAJAS REGISTRADAS. CREA LA PRIMERA CAJA.
                </td>
              </tr>
            ) : (
              registers.map(reg => (
                <tr key={reg.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-foreground uppercase">{reg.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {reg.location || "Sin ubicación"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs">{reg._count.cashShifts}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-none ${
                      reg.isActive 
                        ? "bg-primary/10 text-primary" 
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {reg.isActive ? "ACTIVA" : "INACTIVA"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleDelete(reg.id)}
                      disabled={loading}
                      className="text-destructive hover:bg-destructive/10 px-2 py-1 rounded-none uppercase text-xs"
                    >
                      ELIMINAR
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}