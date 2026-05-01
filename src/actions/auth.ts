"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function registerUser(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = formData.get("password") as string
  const name = String(formData.get("name") ?? "").trim()

  if (!email || !password || !name) {
    throw new Error("Todos los campos son requeridos")
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  })

  if (existingUser) {
    throw new Error("Ya existe un usuario con este correo. Por favor ingresa al login o usa otro correo.")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    }
  })

  await signIn("credentials", {
    email,
    password,
    redirect: false
  })

  redirect("/dashboard")
}