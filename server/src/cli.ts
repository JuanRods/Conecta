import { migrate, pool, resetAndSeed, seed } from "./db.js";

/**
 * CLI de banco: `tsx src/cli.ts <migrate|seed|reset>`
 *   migrate — (re)cria o schema
 *   seed    — injeta os dados de demonstração
 *   reset   — migrate + seed (uso típico em desenvolvimento)
 */
const command = process.argv[2] ?? "reset";

const actions: Record<string, () => Promise<void>> = {
  migrate,
  seed,
  reset: resetAndSeed,
};

const action = actions[command];
if (!action) {
  console.error(`Comando desconhecido: ${command}. Use migrate | seed | reset.`);
  process.exit(1);
}

action()
  .then(() => console.log(`[db] ${command} concluído.`))
  .catch((err) => {
    console.error(`[db] falha em ${command}:`, err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
