const express = require("express");
const { getSql } = require("../lib/db");
const { verifyPin, hashPin, issueToken, requireAuth, getClientIp } = require("../lib/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();
const MAX_ATTEMPTS = 5;

router.post("/login", asyncHandler(async (req, res) => {
  const { pin } = req.body || {};

  if (!/^\d{4}$/.test(pin || "")) {
    return res.status(400).json({ error: "Digite os 4 números da senha." });
  }

  const sql = getSql();
  const ip = getClientIp(req);

  // Bloqueia depois de várias tentativas erradas seguidas, nos últimos 15 minutos.
  const recent = await sql`
    SELECT COUNT(*)::int AS count FROM login_attempts
    WHERE ip = ${ip} AND success = false AND attempted_at > now() - interval '15 minutes'
  `;
  if (recent[0].count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: "Muitas tentativas erradas. Aguarde alguns minutos e tente de novo." });
  }

  const settingRow = await sql`SELECT value FROM settings WHERE key = 'pin_hash'`;
  const pinHash = settingRow[0]?.value;
  if (!pinHash) {
    return res.status(500).json({ error: "Senha ainda não configurada no servidor." });
  }

  const valid = verifyPin(pin, pinHash);
  await sql`INSERT INTO login_attempts (ip, success) VALUES (${ip}, ${valid})`;

  if (!valid) {
    return res.status(401).json({ error: "Senha incorreta." });
  }

  res.json({ token: issueToken() });
}));

router.post("/change-pin", requireAuth, asyncHandler(async (req, res) => {
  const { pin } = req.body || {};
  if (!/^\d{4}$/.test(pin || "")) {
    return res.status(400).json({ error: "Digite 4 números." });
  }

  const sql = getSql();
  const newHash = hashPin(pin);
  await sql`
    INSERT INTO settings (key, value) VALUES ('pin_hash', ${newHash})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;

  res.json({ ok: true });
}));

module.exports = router;
