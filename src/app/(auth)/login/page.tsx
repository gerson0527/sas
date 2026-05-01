"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { alert } from "@/lib/alert"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = formData.get("password") as string

    try {
      console.warn("[login] enviando signIn credentials…", {
        origin: typeof window !== "undefined" ? window.location.origin : null,
      })
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      console.warn("[login] respuesta signIn", {
        ok: res?.ok,
        error: res?.error ?? null,
        status: res?.status,
        url: res?.url ?? null,
      })

      const failed = Boolean(res?.error)
      if (failed) {
        console.warn(
          "[login] signIn fallido: con Auth.js revisa solo `error`; `ok` puede ser true aunque haya CredentialsSignin"
        )
        alert.error("Correo electrónico o contraseña no válidos")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      console.error("[login] excepción en signIn", error)
      alert.error("Algo salió mal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background text-foreground">
      {/* Left Side - Tactical Screen */}
      <div className="relative hidden h-full flex-col bg-card/30 p-10 text-primary lg:flex border-r border-border">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 flex items-center text-sm font-bold uppercase tracking-widest gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-6 w-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="9"></rect><rect x="14" y="7" width="3" height="5"></rect></svg>
          </div>
          <div className="flex flex-col">
            <span>Comando Táctico</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-primary animate-pulse rounded-full" />
              Puerta de Enlace Segura
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative z-20 mt-auto font-mono text-xs uppercase tracking-wider space-y-3"
        >
          <p className="text-primary">&gt; [SYSTEM] ::: INIT &gt;&gt; ^^^ cargando canal seguro</p>
          <p className="text-muted-foreground">&gt; CH#2 | 1231.9082464.500 ... xR3</p>
          <p className="text-muted-foreground">&gt; ENLACE ESTABLECIDO. NODO ACTIVO.</p>
          <p className="font-bold text-primary animate-pulse">&gt; CLAVE BLOQUEADA</p>
          <p className="text-muted-foreground">&gt; MSG &gt;&gt; "...esperando credenciales de operador"</p>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="lg:p-8 flex items-center justify-center h-screen w-full bg-background relative overflow-hidden">
        {/* Subtle decorative corners */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary/50 hidden lg:block" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary/50 hidden lg:block" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary/50 hidden lg:block" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary/50 hidden lg:block" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]"
        >
          <div className="flex flex-col space-y-2 text-left border-l-2 border-primary pl-4">
            <h1 className="text-2xl font-bold tracking-widest uppercase text-foreground">
              Inicio de Sesión de Operador
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Ingrese sus credenciales para acceder al centro de mando
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-muted-foreground">ID de Red (Correo Electrónico)</Label>
              <Input id="email" name="email" type="email" required placeholder="operador@red.local" className="rounded-none border-border bg-card/30 focus-visible:ring-1 focus-visible:ring-primary h-12 text-sm font-mono uppercase placeholder:text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-muted-foreground">Código de Acceso</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="rounded-none border-border bg-card/30 focus-visible:ring-1 focus-visible:ring-primary h-12 text-sm font-mono tracking-widest pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full rounded-none h-12 uppercase tracking-widest font-bold bg-primary/10 border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all" disabled={loading}>
              {loading ? "Autenticando..." : "Inicializar Conexión"}
            </Button>
            
            <div className="text-center">
              <a href="/forgot-password" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
