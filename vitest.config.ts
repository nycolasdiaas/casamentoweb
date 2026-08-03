import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  plugins: [react()],
  test: {
    pool: "threads",
    fileParallelism: false,
    maxWorkers: 1,
    environment: "jsdom",

    // O limite padrão do vitest é 5 s, e ele não cabe aqui.
    //
    // Os testes falam com um Postgres REMOTO (Supabase, isolado por schema —
    // ver AGENTS.md), onde uma ida custa **171 ms medidos**. Cinco segundos
    // dão ~29 idas; só limpar as tabelas entre casos gasta ~1 s, e um teste de
    // provisionamento faz uma transação com dezena e meia de comandos antes de
    // começar a verificar qualquer coisa.
    //
    // Os nove testes que estouravam (provision e publish) não eram lentos por
    // defeito: eram lentos porque a rede é lenta. Aumentar o limite é o que
    // corresponde à realidade — reduzi-los a menos idas ao banco seria testar
    // menos.
    //
    // 20 s dá folga de ~4x sobre o pior caso observado. Se um teste passar
    // disso, aí é defeito de verdade e o limite avisa.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    setupFiles: ["./vitest.setup.ts"],
    env: {
      ADMIN_SESSION_SECRET:
        process.env.ADMIN_SESSION_SECRET ?? "test-secret-do-not-use-in-prod",
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? "",
      DATABASE_SCHEMA: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
