const express = require("express");
const { getSql } = require("../lib/db");
const { requireAuth } = require("../lib/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();
const MAX_TEXT = 500;
const MAX_IMAGES = 10;

function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    volume: row.volume,
    description: row.description,
    images: row.images || [],
  };
}

// Validação no servidor — nunca confiar só no que o navegador manda.
function validate(data) {
  if (typeof data.name !== "string" || !data.name.trim() || data.name.length > MAX_TEXT) {
    return "Nome do produto inválido.";
  }
  if (typeof data.category !== "string" || !data.category.trim() || data.category.length > MAX_TEXT) {
    return "Categoria inválida.";
  }
  if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price < 0 || data.price > 1000000) {
    return "Preço inválido.";
  }
  if (data.volume !== undefined && (typeof data.volume !== "string" || data.volume.length > 100)) {
    return "Volume inválido.";
  }
  if (data.description !== undefined && (typeof data.description !== "string" || data.description.length > 2000)) {
    return "Descrição inválida.";
  }
  if (!Array.isArray(data.images) || data.images.length === 0 || data.images.length > MAX_IMAGES) {
    return "Envie de 1 a 10 fotos.";
  }
  if (!data.images.every((url) => typeof url === "string" && /^https:\/\//.test(url) && url.length < 1000)) {
    return "Uma ou mais fotos são inválidas.";
  }
  return null;
}

router.get("/", asyncHandler(async (req, res) => {
  const sql = getSql();
  const rows = await sql`SELECT * FROM produtos ORDER BY name ASC`;
  res.json(rows.map(toProduct));
}));

router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const data = req.body || {};
  const error = validate(data);
  if (error) return res.status(400).json({ error });

  const sql = getSql();
  const rows = await sql`
    INSERT INTO produtos (name, category, price, volume, description, images)
    VALUES (${data.name.trim()}, ${data.category.trim()}, ${data.price}, ${data.volume || ""}, ${data.description || ""}, ${data.images})
    RETURNING *
  `;
  res.status(201).json(toProduct(rows[0]));
}));

router.put("/", requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id inválido" });

  const data = req.body || {};
  const error = validate(data);
  if (error) return res.status(400).json({ error });

  const sql = getSql();
  const rows = await sql`
    UPDATE produtos SET
      name = ${data.name.trim()},
      category = ${data.category.trim()},
      price = ${data.price},
      volume = ${data.volume || ""},
      description = ${data.description || ""},
      images = ${data.images},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  if (rows.length === 0) return res.status(404).json({ error: "Produto não encontrado" });
  res.json(toProduct(rows[0]));
}));

router.delete("/", requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id inválido" });

  const sql = getSql();
  await sql`DELETE FROM produtos WHERE id = ${id}`;
  res.json({ ok: true });
}));

module.exports = router;
