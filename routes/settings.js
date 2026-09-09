const express = require("express");
const { getSql } = require("../lib/db");
const { requireAuth } = require("../lib/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const sql = getSql();
  const rows = await sql`SELECT value FROM settings WHERE key = 'whatsapp'`;
  res.json({ whatsapp: rows[0]?.value || "" });
}));

router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const whatsapp = String((req.body || {}).whatsapp || "").replace(/\D/g, "");
  if (!whatsapp || whatsapp.length < 10 || whatsapp.length > 15) {
    return res.status(400).json({ error: "Número de WhatsApp inválido." });
  }

  const sql = getSql();
  await sql`
    INSERT INTO settings (key, value) VALUES ('whatsapp', ${whatsapp})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  res.json({ ok: true });
}));

module.exports = router;
