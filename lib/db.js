const { neon } = require("@neondatabase/serverless");

let sqlClient = null;

// Conexão com o Neon. A DATABASE_URL só existe no servidor (variável de
// ambiente configurada no Render) — nunca é enviada para o navegador.
function getSql() {
  if (!sqlClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL não configurada no ambiente.");
    }
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

module.exports = { getSql };
