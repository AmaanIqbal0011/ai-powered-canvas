import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env file:\n" +
        '  DATABASE_URL="postgresql://user:password@host:5432/db"\n' +
        "Or for Prisma Accelerate / Postgres:\n" +
        '  DATABASE_URL="prisma+postgres://<connection-string>"'
    );
  }

  if (url.startsWith("prisma+postgres://")) {
    // Accelerate / Prisma Postgres — Prisma handles the connection
    return new PrismaClient({ accelerateUrl: url });
  }

  // Direct PostgreSQL connection via driver adapter
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
