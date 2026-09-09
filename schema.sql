-- Execute este script uma vez no editor SQL do Neon (Console → SQL Editor).
-- Cria as tabelas usadas pelo site: produtos, configurações e o registro
-- de tentativas de login (usado para bloquear tentativas de força bruta
-- na senha de 4 números).

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  volume TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
  ON login_attempts (ip, attempted_at);

-- Valor inicial do WhatsApp (troque depois pela engrenagem do site, ou
-- edite aqui mesmo).
INSERT INTO settings (key, value)
VALUES ('whatsapp', '5500000000000')
ON CONFLICT (key) DO NOTHING;

-- A senha de 4 números (guardada como hash, nunca em texto puro) é
-- inserida depois, com o comando exato que o Claude vai te passar assim
-- que você escolher os 4 números — não rode a linha abaixo ainda:
--
-- INSERT INTO settings (key, value) VALUES ('pin_hash', 'COLE_O_HASH_AQUI')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
