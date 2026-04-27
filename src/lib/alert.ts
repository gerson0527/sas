/**
 * Sistema de Alertas "Tactical Command"
 * Helper centralizado para notificaciones en todo el proyecto.
 * 
 * Uso recomendado:
 *   import { alert } from "@/lib/alert"
 *   alert.success("PRODUCTO CREADO")
 *   alert.error("ERROR AL ELIMINAR")
 *   alert.warning("STOCK BAJO")
 *   alert.info("VENTA PROCESADA")
 */

import { toast } from "sonner"

export const alert = {
  success: (message: string, description?: string) =>
    toast.success(message, {
      description,
      duration: 3500,
    }),

  error: (message: string, description?: string) =>
    toast.error(message, {
      description,
      duration: 5000,
    }),

  warning: (message: string, description?: string) =>
    toast.warning(message, {
      description,
      duration: 4000,
    }),

  info: (message: string, description?: string) =>
    toast.info(message, {
      description,
      duration: 3500,
    }),
}

export const alertSuccess = alert.success
export const alertError = alert.error
export const alertWarning = alert.warning
export const alertInfo = alert.info