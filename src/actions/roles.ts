"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { AVAILABLE_PERMISSIONS } from "@/lib/constants"

export async function getRoles(storeId: string) {
  return await prisma.customRole.findMany({
    where: { storeId },
    include: {
      permissions: true
    },
    orderBy: { name: 'asc' }
  })
}

export async function createRole(storeId: string, name: string, permissionNames: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  // Crear o encontrar permisos
  const permissions = await Promise.all(
    permissionNames.map(async (permName) => {
      let perm = await prisma.permission.findUnique({ where: { name: permName } })
      if (!perm) {
        perm = await prisma.permission.create({
          data: { name: permName }
        })
      }
      return perm
    })
  )

  const role = await prisma.customRole.create({
    data: {
      name,
      storeId,
      permissions: {
        connect: permissions.map(p => ({ id: p.id }))
      }
    },
    include: { permissions: true }
  })

  revalidatePath("/settings/roles")
  return role
}

export async function updateRole(roleId: string, name: string, permissionNames: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  // Desconectar todos los permisos actuales
  await prisma.customRole.update({
    where: { id: roleId },
    data: { permissions: { disconnect: [] } }
  })

  // Encontrar o crear permisos
  const permissions = await Promise.all(
    permissionNames.map(async (permName) => {
      let perm = await prisma.permission.findUnique({ where: { name: permName } })
      if (!perm) {
        perm = await prisma.permission.create({
          data: { name: permName }
        })
      }
      return perm
    })
  )

  const role = await prisma.customRole.update({
    where: { id: roleId },
    data: {
      name,
      permissions: {
        connect: permissions.map(p => ({ id: p.id }))
      }
    },
    include: { permissions: true }
  })

  revalidatePath("/settings/roles")
  return role
}

export async function deleteRole(roleId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  // Verificar que no haya usuarios con este rol
  const usersWithRole = await prisma.storeUser.count({
    where: { customRoleId: roleId }
  })

  if (usersWithRole > 0) {
    throw new Error(`No se puede eliminar. Hay ${usersWithRole} usuario(s) con este rol.`)
  }

  await prisma.customRole.delete({
    where: { id: roleId }
  })

  revalidatePath("/settings/roles")
}

export async function seedDefaultRoles(storeId: string) {
  // Crear roles por defecto si no existen
  const existingRoles = await prisma.customRole.count({ where: { storeId } })
  if (existingRoles > 0) return

  // Rol Administrador
  const adminPerms = AVAILABLE_PERMISSIONS.filter(p => 
    ["manage_products", "manage_categories", "manage_suppliers", "manage_customers", 
     "manage_purchases", "process_sales", "view_reports", "view_financials"].includes(p.name)
  )
  
  // Encontrar o crear permisos
  const adminPermissions = await Promise.all(
    adminPerms.map(async (p) => {
      let perm = await prisma.permission.findUnique({ where: { name: p.name } })
      if (!perm) perm = await prisma.permission.create({ data: { name: p.name, description: p.description } })
      return perm
    })
  )

  await prisma.customRole.create({
    data: {
      name: "Administrador",
      storeId,
      permissions: { connect: adminPermissions.map(p => ({ id: p.id })) }
    }
  })

  // Rol Vendedor/Cajero
  const cashierPerms = AVAILABLE_PERMISSIONS.filter(p => 
    ["process_sales"].includes(p.name)
  )

  const cashierPermissions = await Promise.all(
    cashierPerms.map(async (p) => {
      let perm = await prisma.permission.findUnique({ where: { name: p.name } })
      if (!perm) perm = await prisma.permission.create({ data: { name: p.name, description: p.description } })
      return perm
    })
  )

  await prisma.customRole.create({
    data: {
      name: "Cajero",
      storeId,
      permissions: { connect: cashierPermissions.map(p => ({ id: p.id })) }
    }
  })

  revalidatePath("/settings/roles")
}