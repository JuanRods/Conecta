import express from "express";
import cors from "cors";
import { migrate, resetDatabase } from "./db.js";
import { seed } from "./seed.js";
import authRoutes from "./routes/auth.js";
import jobsRoutes from "./routes/jobs.js";
import companyRoutes from "./routes/companies.js";
import candidateRoutes from "./routes/candidate.js";
import reportRoutes from "./routes/reports.js";
import moderationRoutes from "./routes/moderation.js";
import metricsRoutes from "./routes/metrics.js";
import privacyRoutes from "./routes/privacy.js";

/**
 * Monta a aplicação Express (sem iniciar o listen). Separado de index.js para
 * permitir que o backend seja montado em memória pelo harness de testes do
 * frontend, exercitando o fluxo real HTTP → Express → SQLite.
 */
export function createApp() {
  migrate();
  seed();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "6mb" })); // currículos (data URL) podem ser grandes

  app.get("/health", (_req, res) =>
    res.json({ ok: true, service: "conecta-api" }),
  );

  // Rota EXCLUSIVA de testes: zera e re-semeia o banco. Só existe quando
  // CONECTA_TEST_RESET=1 (habilitado pelo harness de testes), nunca em produção.
  if (process.env.CONECTA_TEST_RESET === "1") {
    app.post("/__test__/reset", (_req, res) => {
      resetDatabase();
      seed();
      res.json({ ok: true });
    });
  }

  app.use("/auth", authRoutes);
  app.use("/jobs", jobsRoutes);
  app.use("/companies", companyRoutes);
  app.use("/candidate", candidateRoutes);
  app.use("/reports", reportRoutes);
  app.use("/moderation", moderationRoutes);
  app.use("/metrics", metricsRoutes);
  app.use("/privacy", privacyRoutes);

  app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada." }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  });

  return app;
}
