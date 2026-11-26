-- 003: who owns a result, and safe retries of the same submission.

-- Results submitted by a signed-in student belong to them.
-- Anonymous results from shared offline devices keep user_id NULL.
ALTER TABLE results ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL;

-- The device generates a UUID per quiz attempt. A unique index means sending
-- the same attempt twice (a retry after a dropped connection) stores it once.
ALTER TABLE results ADD COLUMN IF NOT EXISTS client_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS results_client_id_key ON results(client_id);

CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
-- Supports the default "newest first" sort on GET /results.
CREATE INDEX IF NOT EXISTS idx_results_at ON results(at DESC);

-- A score can never be more than the number of questions.
-- NOT VALID: enforce for every new row without re-checking old rows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_score_lte_total') THEN
    ALTER TABLE results ADD CONSTRAINT results_score_lte_total CHECK (score <= total) NOT VALID;
  END IF;
END $$;
