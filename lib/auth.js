const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const TOKEN_TTL = "12h";
const SCRYPT_KEYLEN = 64;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado no ambiente.");
  return secret;
}

// --- Senha de 4 números: hash com salt (nunca guardada em texto puro) ---
// Formato armazenado: "salt:hash", ambos em hexadecimal.

function hashPin(pin, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.scryptSync(pin, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPin(pin, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const derived = crypto.scryptSync(pin, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

// --- Token de sessão (JWT), emitido após a senha correta ---

function issueToken() {
  return jwt.sign({ role: "admin" }, getJwtSecret(), { expiresIn: TOKEN_TTL });
}

// Recebe o valor bruto do header Authorization (ex: "Bearer eyJ...") e
// devolve true/false — não depende de Express nem de nenhum framework.
function isAuthorized(authorizationHeader) {
  const header = authorizationHeader || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return false;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    return payload.role === "admin";
  } catch (err) {
    return false;
  }
}

// Middleware Express que exige um token válido.
function requireAuth(req, res, next) {
  if (!isAuthorized(req.headers.authorization)) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

module.exports = { hashPin, verifyPin, issueToken, isAuthorized, requireAuth, getClientIp };
