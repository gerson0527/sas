"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteUser, removeUser, updateUserRole, updateUserStore, createTeamUser, removeUserFromStore } from "@/actions/team"
import { alert } from "@/lib/alert"

type StoreUser = {
  id: string
  customRoleId: string | null
  customRole: { id: string; name: string } | null
  userId: string
  defaultCashRegisterId: string | null
  defaultCashRegister: { name: string } | null
  user: { id: string; name: string | null; email: string }
}

type Role = {
  id: string
  name: string
}

type CashRegister = {
  id: string
  name: string
}

export function TeamClient({ 
  storeId, 
  roles: initialRoles, 
  storeUsers: initialStoreUsers,
  currentUserId,
  registers = []
}: { 
  storeId: string
  roles: Role[]
  storeUsers: StoreUser[]
  currentUserId: string
  registers?: CashRegister[]
}) {
  const router = useRouter()
  const [roles] = useState(initialRoles)
  const [storeUsers] = useState(initialStoreUsers)
  const [loading, setLoading] = useState(false)
  
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedRegister, setSelectedRegister] = useState("")

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newName || !newEmail || !newPassword || !selectedRole) {
      alert.error("TODOS LOS CAMPOS SON REQUERIDOS")
      return
    }
    
    setLoading(true)
    try {
      const result = await createTeamUser(storeId, {
        name: newName,
        email: newEmail,
        password: newPassword,
        roleId: selectedRole,
        defaultCashRegisterId: selectedRegister || null
      })
      
      if (result && "error" in result) {
        alert.error(result.error as string)
      } else {
        alert.success("USUARIO CREADO")
        setNewName("")
        setNewEmail("")
        setNewPassword("")
        setSelectedRole("")
        setSelectedRegister("")
        router.refresh()
      }
    } catch (err: any) {
      alert.error(err.message || "ERROR AL CREAR USUARIO")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(storeUserId: string, userId: string) {
    if (userId === currentUserId) {
      alert.error("NO PUEDES ELIMINARTE A TI MISMO")
      return
    }
    
    if (!confirm("¿ELIMINAR ESTE USUARIO?")) return
    
    setLoading(true)
    try {
      await removeUserFromStore(storeUserId)
      alert.success("USUARIO ELIMINADO")
      router.refresh()
    } catch (err: any) {
      alert.error(err.message || "ERROR AL ELIMINAR")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-widest text-primary">
          GESTIÓN DE EQUIPO
        </h1>
      </div>

      <div className="rounded-none border border-border bg-card/30 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Miembros del Equipo: {storeUsers.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs uppercase tracking-wider">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 font-medium">NOMBRE</th>
                <th className="pb-2 font-medium">EMAIL</th>
                <th className="pb-2 font-medium">ROL</th>
                <th className="pb-2 font-medium">CAJA</th>
                <th className="pb-2 font-medium text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {storeUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground/50">
                    NO HAY MIEMBROS EN EL EQUIPO
                  </td>
                </tr>
              ) : (
                storeUsers.map((su) => (
                  <tr key={su.id} className="border-b border-border/50 hover:bg-primary/5">
                    <td className="py-3 font-bold">{su.user.name || "Sin nombre"}</td>
                    <td className="py-3 text-muted-foreground">{su.user.email}</td>
                    <td className="py-3">
                      <span className="border border-border bg-background px-2 py-0.5 rounded-none">
                        {su.customRole?.name || "Sin rol"}
                      </span>
                    </td>
                    <td className="py-3">
                      {su.defaultCashRegister ? (
                        <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-none">
                          {su.defaultCashRegister.name}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {su.userId !== currentUserId ? (
                        <button 
                          onClick={() => handleRemove(su.id, su.userId)}
                          disabled={loading}
                          className="text-destructive hover:bg-destructive/10 px-2 py-1 rounded-none uppercase tracking-widest"
                        >
                          ELIMINAR
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-[10px] uppercase">TÚ</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-none border border-border bg-card/30 p-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
          CREAR NUEVO USUARIO
        </h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="NOMBRE COMPLETO"
              className="rounded-none uppercase"
            />
          </div>
          <div>
            <Input 
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="CORREO (USERNAME)"
              className="rounded-none lowercase"
            />
          </div>
          <div>
            <Input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="CONTRASEÑA"
              className="rounded-none"
            />
          </div>
          <div>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-10 w-full border border-border bg-card px-2 rounded-none text-xs uppercase"
              required
            >
              <option value="">SELECCIONAR ROL</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select 
              value={selectedRegister}
              onChange={(e) => setSelectedRegister(e.target.value)}
              className="h-10 w-full border border-border bg-card px-2 rounded-none text-xs uppercase"
            >
              <option value="">CAJA (OPCIONAL)</option>
              {registers.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full rounded-none uppercase tracking-widest font-bold h-10">
              {loading ? "CREANDO..." : "CREAR USUARIO"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}