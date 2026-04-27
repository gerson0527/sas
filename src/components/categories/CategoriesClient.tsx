"use client"

import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CategoryForm } from "@/components/forms/CategoryForm"
import { CategoryActions } from "@/components/categories/CategoryActions"
import { Pagination } from "@/components/ui/Pagination"

type Category = {
  id: string
  name: string
  parentId: string | null
}

type CategoriesClientProps = {
  categories: Category[]
  storeId: string
  parentCategories: Category[]
}

export function CategoriesClient({ categories: initialCategories, storeId, parentCategories }: CategoriesClientProps) {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    setMounted(true)
    setCategories(initialCategories)
  }, [initialCategories])

  useEffect(() => {
    setCurrentPage(1)
  }, [categories.length])

  const totalPages = Math.ceil(categories.length / pageSize)
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return categories.slice(start, start + pageSize)
  }, [categories, currentPage])

  return (
    <div className="rounded-none border border-border bg-card/30 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold uppercase tracking-widest text-xs text-muted-foreground">#</TableHead>
            <TableHead className="font-bold uppercase tracking-widest text-xs text-muted-foreground">NOMBRE</TableHead>
            <TableHead className="font-bold uppercase tracking-widest text-xs text-muted-foreground">TIPO</TableHead>
            <TableHead className="font-bold uppercase tracking-widest text-xs text-muted-foreground">PRINCIPAL</TableHead>
            <TableHead className="text-right font-bold uppercase tracking-widest text-xs text-muted-foreground">ACCIONES</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-mono text-sm">
          {paginatedCategories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center uppercase tracking-widest text-muted-foreground/50">
                NO SE DETECTARON CATEGORÍAS
              </TableCell>
            </TableRow>
          ) : (
            paginatedCategories.map((category, idx) => (
              <TableRow key={category.id} className="hover:bg-primary/5 transition-colors border-border">
                <TableCell className="text-muted-foreground">{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                <TableCell className="font-bold text-foreground uppercase">
                  {category.parentId ? "↳ " : ""}{category.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className={`text-[10px] px-2 py-0.5 rounded-none uppercase ${
                    category.parentId 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-primary/10 text-primary"
                  }`}>
                    {category.parentId ? "SUBCATEGORÍA" : "PRINCIPAL"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {category.parentId 
                    ? categories.find(c => c.id === category.parentId)?.name || "—"
                    : "—"
                  }
                </TableCell>
                <TableCell className="text-right">
                  <CategoryActions category={category as any} storeId={storeId} parentCategories={categories as any} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  )
}