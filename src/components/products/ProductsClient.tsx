"use client"

import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProductForm } from "@/components/forms/ProductForm"
import { ProductActions } from "@/components/products/ProductActions"
import { Pagination } from "@/components/ui/Pagination"

type Product = {
  id: string
  sku: string | null
  name: string
  price: number
  regularPrice: number | null
  cost: number | null
  stock: number
  minStock: number
  taxRate: number
  category: { name: string | null } | null
  supplier: { name: string | null } | null
}

type ProductsClientProps = {
  products: Product[]
  storeId: string
  categories: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
}

export function ProductsClient({ products: initialProducts, storeId, categories, suppliers }: ProductsClientProps) {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    setMounted(true)
    setProducts(initialProducts)
  }, [initialProducts])

  useEffect(() => {
    setCurrentPage(1)
  }, [products.length])

  const totalPages = Math.ceil(products.length / pageSize)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return products.slice(start, start + pageSize)
  }, [products, currentPage])

  return (
    <div className="rounded-none border border-border bg-card/30 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground w-[40px]">#</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[100px]">NOMBRE</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[80px]">CATEGORÍA</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[80px]">PROVEEDOR</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground text-right min-w-[60px]">COSTO</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground text-right min-w-[70px]">PRECIO</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground text-center min-w-[50px]">IVA</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground text-center min-w-[60px]">STOCK</TableHead>
              <TableHead className="text-right font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[80px]">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono text-xs">
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center uppercase tracking-widest text-muted-foreground/50">
                  NO SE DETECTARON PRODUCTOS
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product, idx) => (
                <TableRow key={product.id} className="hover:bg-primary/5 transition-colors border-border">
                  <TableCell className="text-muted-foreground text-[10px] py-2">{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex flex-col">
                      <span className="uppercase font-bold text-[10px] leading-tight">{product.name}</span>
                      <span className="text-[9px] text-muted-foreground">{product.sku || 'Sin SKU'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="uppercase text-muted-foreground text-[10px] py-2">
                    {product.category?.name || <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="uppercase text-muted-foreground text-[10px] py-2">
                    {product.supplier?.name || <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-right text-[10px] py-2 text-muted-foreground">
                    {product.cost ? `$${product.cost.toFixed(0)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-primary text-[11px]">${product.price.toFixed(0)}</span>
                      {product.regularPrice && product.regularPrice > product.price && (
                        <span className="text-[9px] line-through text-muted-foreground">${product.regularPrice.toFixed(0)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-[10px] py-2">
                    <span className={`${product.taxRate > 0 ? "text-muted-foreground" : "text-orange-500"}`}>
                      {product.taxRate > 0 ? `${product.taxRate}%` : "EX"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <span className={`inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-none text-[10px] font-bold ${product.stock <= product.minStock ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-primary/10 text-primary border border-primary/20"}`}>
                      {product.stock <= product.minStock && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-2.5 w-2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      )}
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <ProductActions product={product as any} storeId={storeId} categories={categories} suppliers={suppliers} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  )
}