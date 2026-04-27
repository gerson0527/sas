"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { seedDefaultRoles } from "./roles"

export async function createStore(formData: FormData) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string

  if (!name || name.trim() === "") {
    throw new Error("Store name is required")
  }

  // Create the store first
  const store = await prisma.store.create({
    data: { name }
  })

  // Seed default roles for this store
  await seedDefaultRoles(store.id)

  // Find the Admin role to assign to the owner
  const adminRole = await prisma.customRole.findFirst({
    where: { storeId: store.id, name: "Administrador" }
  })

  // Link the user to the store with the admin role
  await prisma.storeUser.create({
    data: {
      userId: userId,
      storeId: store.id,
      customRoleId: adminRole?.id
    }
  })

  redirect("/dashboard")
}
