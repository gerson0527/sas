"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { alert } from "@/lib/alert"
import * as XLSX from "xlsx"

type BulkImportDialogProps = {
  storeId: string
  entityName: string // e.g. "PRODUCTOS", "CLIENTES"
  onImport: (storeId: string, data: any[]) => Promise<void>
  templateUrl?: string // Optional link to download a template
}

export function BulkImportDialog({ storeId, entityName, onImport, templateUrl }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      if (jsonData.length === 0) {
        alert.error("El archivo está vacío.")
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      await onImport(storeId, jsonData)
      alert.success("Importación exitosa", `Se importaron ${jsonData.length} registros.`)
      setOpen(false)
    } catch (error: any) {
      console.error(error)
      alert.error("Error de importación", error.message || "Ocurrió un error al procesar el archivo.")
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="rounded-none uppercase tracking-widest font-bold border-primary text-primary hover:bg-primary/10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 mr-2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          IMPORTAR {entityName}
        </Button>
      } />
      <DialogContent className="sm:max-w-[500px] rounded-none border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            IMPORTACIÓN MASIVA
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-wider font-mono">
            Sube un archivo Excel (.xlsx) o CSV para cargar múltiples {entityName.toLowerCase()} a la vez.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border bg-card/30 rounded-none cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="h-10 w-10 text-muted-foreground mb-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <Label className="text-sm font-bold uppercase tracking-widest text-primary cursor-pointer mb-1">
              {loading ? "PROCESANDO ARCHIVO..." : "SELECCIONAR ARCHIVO EXCEL/CSV"}
            </Label>
            <span className="text-xs text-muted-foreground uppercase font-mono">
              O ARRASTRA Y SUELTA AQUÍ
            </span>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </div>
          
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-none">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">FORMATO ESPERADO</h4>
            <p className="text-[10px] uppercase font-mono text-muted-foreground mb-2">
              Asegúrate de que la primera fila contenga los nombres de las columnas. Las columnas esperadas incluyen:
            </p>
            <p className="text-[10px] uppercase font-mono font-bold">
              {entityName === "PRODUCTOS" 
                ? "NOMBRE, SKU, PRECIO, PRECIO_NORMAL, COSTO, STOCK, STOCK_MINIMO, TIPO_IMPUESTO, IVA, UNIDAD_MEDIDA" 
                : "NOMBRE, DOCUMENTO, EMAIL, TELEFONO, DIRECCION, LIMITE_CREDITO, DEUDA_INICIAL"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}