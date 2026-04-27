import { getRoles, seedDefaultRoles } from "@/actions/roles"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RoleForm } from "@/components/forms/RoleForm"
import { AVAILABLE_PERMISSIONS } from "@/lib/constants"
import { requirePermission } from "@/lib/permissions"
import type { Permission } from "@/lib/constants"
import Link from "next/link"
import { RoleActions } from "@/components/roles/RoleActions"

export default async function RolesPage() {
  const session = await auth()
  
  const userStores = await prisma.storeUser.findMany({
    where: { userId: session?.user?.id },
    include: { store: true }
  })
  
  const storeId = userStores[0]?.storeId
  
  if (storeId) {
    await requirePermission(storeId, "manage_roles")
  }
  
  const roles = storeId ? await getRoles(storeId) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">ROLES Y PERMISOS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Define roles personalizados y sus permisos
          </p>
        </div>
        {storeId && <RoleForm storeId={storeId} />}
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <div className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
            PERMISOS DISPONIBLES
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {AVAILABLE_PERMISSIONS.map(perm => (
              <div key={perm.name} className="bg-background border border-border p-2 rounded-none">
                <span className="text-[10px] font-bold uppercase text-foreground block">{perm.label}</span>
                <span className="text-[9px] text-muted-foreground">{perm.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
            ROLES DEFINIDOS
          </h2>
        </div>
        <div className="divide-y divide-border">
          {roles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground/50">
                NO HAY ROLES DEFINIDOS
              </p>
            </div>
          ) : (
            roles.map(role => (
              <div key={role.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black uppercase text-primary">{role.name}</h3>
                    <span className="text-[9px] text-muted-foreground uppercase">
                      {role.permissions.length} permiso(s)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <RoleForm storeId={storeId!} existingRole={role} isEdit />
                    <RoleActions role={role} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm: any) => {
                    const permInfo = AVAILABLE_PERMISSIONS.find(p => p.name === perm.name)
                    return (
                      <span key={perm.id} className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-none">
                        {permInfo ? permInfo.label : perm.name.replace(/_/g, " ")}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}