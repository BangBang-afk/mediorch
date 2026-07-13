import { PrismaClient } from "@prisma/client"
import { execSync } from "child_process"
import * as fs from "fs"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function ensureDb(): void {
  if (process.env.VERCEL) {
    const dbPath = "/tmp/dev.db"
    process.env.DATABASE_URL = `file:${dbPath}`

    if (!fs.existsSync(dbPath)) {
      execSync("npx prisma db push --skip-generate", {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
        stdio: "pipe",
      })
    }
  }
}

ensureDb()

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
