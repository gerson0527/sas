"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FirstPasswordModalProps {
  isOpen: boolean
}

export function FirstPasswordModal({ isOpen }: FirstPasswordModalProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validatePassword = (p: string) => {
    if (p.length < 8) return "Mínimo 8 caracteres"
    if (!/[A-Z]/.test(p)) return "Al menos 1 mayúscula"
    if (!/[0-9]/.test(p)) return "Al menos 1 número"
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validation = validatePassword(password)
    if (validation) {
      setError(validation)
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al guardar")
        return
      }

      router.refresh()
      router.push("/pos")
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} modal>
      <DialogContent 
        className="sm:max-w-[425px] rounded-none border-2 border-primary bg-background shadow-2xl shadow-primary/20"
        showCloseButton={false}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-6 w-6">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Restablecer Contraseña
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Esta es tu primera vez. Debes establecer una contraseña para continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-widest font-mono">
              Nueva Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-none border-border focus:border-primary font-mono tracking-wider"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-xs uppercase tracking-widest font-mono">
              Confirmar Contraseña
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-none border-border focus:border-primary font-mono tracking-wider"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/50 p-3">
              <p className="text-xs text-destructive uppercase tracking-widest font-mono">
                {error}
              </p>
            </div>
          )}

          <div className="bg-muted/30 p-3 border border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              La contraseña debe incluir:
            </p>
            <ul className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mt-1 space-y-1">
              <li className={password.length >= 8 ? "text-primary" : ""}>
                {password.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
              </li>
              <li className={/[A-Z]/.test(password) ? "text-primary" : ""}>
                {/[A-Z]/.test(password) ? "✓" : "○"} Al menos 1 mayúscula
              </li>
              <li className={/[0-9]/.test(password) ? "text-primary" : ""}>
                {/[0-9]/.test(password) ? "✓" : "○"} Al menos 1 número
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none uppercase tracking-widest font-bold bg-primary hover:bg-primary/90"
            >
              {loading ? "Guardando..." : "Establecer Contraseña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}