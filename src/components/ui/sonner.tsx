"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, OctagonXIcon, TriangleAlertIcon, InfoIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <div className="bg-primary/10 border border-primary/20 rounded-none p-1">
            <CircleCheckIcon className="size-5 text-primary" strokeWidth={2.5} />
          </div>
        ),
        error: (
          <div className="bg-destructive/10 border border-destructive/20 rounded-none p-1">
            <OctagonXIcon className="size-5 text-destructive" strokeWidth={2.5} />
          </div>
        ),
        warning: (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-none p-1">
            <TriangleAlertIcon className="size-5 text-orange-500" strokeWidth={2.5} />
          </div>
        ),
        info: (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-none p-1">
            <InfoIcon className="size-5 text-blue-500" strokeWidth={2.5} />
          </div>
        ),
        loading: (
          <div className="bg-muted border border-border rounded-none p-1">
            <Loader2Icon className="size-5 text-muted-foreground animate-spin" />
          </div>
        ),
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "0px",
          "--toast-duration": "3000ms",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "tactical-toast group",
          title: "tactical-title",
          description: "tactical-description",
          actionButton: "tactical-action",
          cancelButton: "tactical-cancel",
        },
        unstyled: false,
      }}
      {...props}
    />
  )
}

export { Toaster }