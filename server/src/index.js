import { createApp } from "./app.js";

/**
 * Ponto de entrada do backend: monta a aplicação e inicia o servidor HTTP.
 * Backend real com banco relacional (SQLite), espelhando os serviços que antes
 * eram mocks em localStorage e mantendo os mesmos contratos para o frontend.
 */

const app = createApp();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Conecta API ouvindo em http://localhost:${PORT}`);
});
