import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations pedem uma conexão direta (ou em modo *session*). Poolers em
    // modo *transaction* — como o do Supabase na porta 6543 — não suportam as
    // travas que o `migrate` usa. Por isso `DIRECT_URL` tem prioridade aqui,
    // enquanto o app em runtime continua usando `DATABASE_URL`.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
