import { createApp } from "./app.js";
import { pool } from "./db.js";

const port = Number(process.env.PORT ?? 3001);

const app = createApp();

const server = app.listen(port, () => {
  console.log(`[api] Conecta Inclusão ouvindo em http://localhost:${port}`);
});

// Encerramento limpo: fecha o HTTP e o pool de conexões.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  });
}
