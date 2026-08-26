import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Em dev o Next recarrega os módulos a cada edição; sem o cache no globalThis
// cada reload abriria um novo pool de conexões com o Postgres.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada. Crie um banco Postgres grátis no Neon e " +
        "preencha a variável (veja o README) — sem ela o app não consegue " +
        "guardar as atividades.",
    );
  }
  // Driver TCP comum, não o serverless do Neon: funciona em qualquer Postgres
  // e não depende de `WebSocket` global, que o Node 20 não tem.
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
