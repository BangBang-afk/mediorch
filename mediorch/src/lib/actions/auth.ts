"use server"

import { prisma } from "@/lib/db"
import { signIn, signOut } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function register(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  await signIn("credentials", { email, password, redirect: false })

  return { success: true }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await signIn("credentials", { email, password, redirect: false })
    return { success: true }
  } catch {
    return { error: "Invalid email or password" }
  }
}

export async function logout() {
  await signOut({ redirect: false })
}
