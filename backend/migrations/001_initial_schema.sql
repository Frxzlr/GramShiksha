-- 001: the original five tables. IF NOT EXISTS makes this safe on a database
-- that was created before migrations existed (our Neon production database).

CREATE TABLE IF NOT EXISTS schools (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT NOT NULL,
  students INT NOT NULL CHECK (students >= 0),
  teachers INT NOT NULL CHECK (teachers >= 0),
  internet_mbps NUMERIC NOT NULL CHECK (internet_mbps >= 0),
  uptime_pct NUMERIC NOT NULL CHECK (uptime_pct >= 0 AND uptime_pct <= 100),
  has_computers INT NOT NULL CHECK (has_computers >= 0)
);

CREATE TABLE IF NOT EXISTS resources (
  id INT PRIMARY KEY,
  school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  stock INT NOT NULL CHECK (stock >= 0),
  needed INT NOT NULL CHECK (needed >= 0)
);

CREATE TABLE IF NOT EXISTS lessons (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  summary_hi TEXT NOT NULL,
  quiz JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT,
  lesson_title TEXT NOT NULL,
  village TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0),
  total INT NOT NULL CHECK (total >= 0),
  at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS connectivity (
  id BIGSERIAL PRIMARY KEY,
  village TEXT NOT NULL,
  mbps NUMERIC NOT NULL,
  rtt_ms NUMERIC,
  online BOOLEAN NOT NULL,
  at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resources_school_id ON resources(school_id);
CREATE INDEX IF NOT EXISTS idx_results_lesson_id ON results(lesson_id);
CREATE INDEX IF NOT EXISTS idx_results_village ON results(village);
CREATE INDEX IF NOT EXISTS idx_connectivity_village ON connectivity(village);
