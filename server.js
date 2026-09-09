const express = require("express");
const path = require("path");

const authRouter = require("./routes/auth");
const productsRouter = require("./routes/products");
const settingsRouter = require("./routes/settings");

const app = express();

app.disable("x-powered-by");
// Usa o parser de query string simples (nativo do Node) em vez do "qs" —
// não precisamos de query strings complexas, e isso evita uma vulnerabilidade
// conhecida na biblioteca "qs" usada por padrão pelo Express.
app.set("query parser", "simple");
app.use(express.json({ limit: "1mb" }));

// Cabeçalhos básicos de segurança em toda resposta.
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Rotas da API — a única parte que fala com o banco de dados.
app.use("/api", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/settings", settingsRouter);

// Tratamento de erro central: nunca vaza detalhes internos para o navegador.
app.use("/api", (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

// Site público (só a pasta "public" fica acessível — o código do
// servidor, as chaves e o schema do banco nunca ficam expostos).
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Angelica rodando na porta ${PORT}`);
});
