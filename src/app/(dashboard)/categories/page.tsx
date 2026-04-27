import { getAllCategories } from "@/actions/categories"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CategoryForm } from "@/components/forms/CategoryForm"
import { CategoriesClient } from "@/components/categories/CategoriesClient"
import { requirePermission } from "@/lib/permissions"
import { Permission } from "@/lib/constants"

export default async function CategoriesPage() {
  const session = await auth()
  
  const userStores = await prisma.storeUser.findMany({
    where: { userId: session?.user?.id },
    include: { store: true }
  })
  
  const storeId = userStores[0]?.storeId
  if (!storeId) return null

  await requirePermission(storeId, "manage_categories")

  const categories = storeId ? await getAllCategories(storeId) : []
  const parentCategories = categories.filter(c => !c.parentId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">CATEGORÍAS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">Gestionar clasificaciones de la tienda</p>
        </div>
        {storeId && (
          <Dialog>
            <DialogTrigger render={
              <Button className="rounded-none uppercase tracking-widest font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-4 w-4 mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                AÑADIR CATEGORÍA
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] rounded-none border border-border bg-background shadow-2xl shadow-primary/10">
              <DialogHeader>
                <DialogTitle className="uppercase tracking-widest font-bold text-primary flex items-center gap-2">
                  <span className="h-2 w-2 bg-primary inline-block"></span>
                  NUEVA CATEGORÍA
                </DialogTitle>
              </DialogHeader>
              <CategoryForm storeId={storeId} categories={parentCategories} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!storeId ? (
        <div className="flex flex-col items-center justify-center py-24 border border-border bg-card/10 rounded-none">
          <div className="h-12 w-12 text-muted-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">TIENDA NO CONFIGURADA</p>
        </div>
      ) : (
        <CategoriesClient 
          categories={categories} 
          storeId={storeId} 
          parentCategories={parentCategories} 
        />
      )}
    </div>
  )
}