-- 004: lesson ids come from a database sequence instead of Date.now(),
-- so two teachers publishing in the same millisecond can never collide.

CREATE SEQUENCE IF NOT EXISTS lessons_id_seq OWNED BY lessons.id;
SELECT setval('lessons_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM lessons), 1));
ALTER TABLE lessons ALTER COLUMN id SET DEFAULT nextval('lessons_id_seq');

-- Which teacher published the lesson (audit trail).
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
