-- 002: accounts and login sessions.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,                -- bcrypt hash, never the password
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'teacher', 'planner')),
  village TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One account per email, case-insensitive (Priya@x.in = priya@x.in).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));

-- Refresh tokens are stored only as SHA-256 hashes, so a leaked database
-- cannot be used to log in. Revoked on logout and on every refresh (rotation).
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
