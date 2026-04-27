"use client"

import { Button } from "@/components/ui/button"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  const maxVisible = 5
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0 rounded-none"
      >
        «
      </Button>
      
      {start > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(start - 1)}
            className="h-8 w-8 p-0 rounded-none"
          >
            ...
          </Button>
        </>
      )}

      {pages.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "ghost"}
          size="sm"
          onClick={() => onPageChange(page)}
          className={`h-8 w-8 p-0 rounded-none ${
            page === currentPage ? "bg-primary text-primary-foreground" : ""
          }`}
        >
          {page}
        </Button>
      ))}

      {end < totalPages && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(end + 1)}
            className="h-8 w-8 p-0 rounded-none"
          >
            ...
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0 rounded-none"
      >
        »
      </Button>
    </div>
  )
}

type PaginatedTableProps<T> = {
  data: T[]
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  children: (items: T[]) => React.ReactNode
  emptyMessage?: string
}

export function PaginatedTable<T>({ 
  data, 
  currentPage, 
  pageSize, 
  onPageChange, 
  children, 
  emptyMessage = "No hay datos" 
}: PaginatedTableProps<T>) {
  const totalPages = Math.ceil(data.length / pageSize)
  const start = (currentPage - 1) * pageSize
  const items = data.slice(start, start + pageSize)

  return (
    <>
      {items.length > 0 ? children(items) : (
        <div className="text-center py-12 text-muted-foreground uppercase text-sm">
          {emptyMessage}
        </div>
      )}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={onPageChange} 
      />
    </>
  )
}