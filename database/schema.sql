-- ============================================================================
-- GramShiksha Rural Education VR & Resource Management Platform
-- Relational Database Schema (SQLite 3.x Dialect)
-- ============================================================================
-- Design Notes & PostgreSQL Differences:
-- 1. Foreign Key Enforcement:
--    SQLite requires `PRAGMA foreign_keys = ON;` per connection.
--    PostgreSQL enforces foreign keys natively by default.
-- 2. Datatypes:
--    - SQLite uses TEXT for UUIDs and ISO-8601 timestamps (created_at).
--      PostgreSQL can use native UUID type and TIMESTAMPTZ.
--    - SQLite uses INTEGER (0/1) for boolean flags (synced_flag).
--      PostgreSQL supports native BOOLEAN type (or SMALLINT with CHECK).
--    - SQLite REAL maps to DOUBLE PRECISION in PostgreSQL.
-- 3. Third Normal Form (3NF):
--    - All tables possess atomic primary keys (1NF).
--    - All non-key attributes are fully functionally dependent on PK (2NF).
--    - No transitive dependencies exist across non-key attributes (3NF).
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- Table: schools
-- Represents rural schools participating in GramShiksha offline learning.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
    school_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    connectivity_status TEXT NOT NULL CHECK (
        connectivity_status IN ('None', 'Poor', 'Moderate', 'Good')
    )
);

-- ----------------------------------------------------------------------------
-- Table: students
-- Enrolled rural learners across grades 1-12.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12)
);

-- ----------------------------------------------------------------------------
-- Table: educational_resources
-- Hardware, experiential kits, and learning supplies per school.
-- Ensures functional inventory never exceeds total inventory.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS educational_resources (
    resource_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
    item_type TEXT NOT NULL CHECK (
        item_type IN ('Textbook', 'Tablet', 'VR Headset', 'Science Kit', 'Projector', 'Solar Charger')
    ),
    total_qty INTEGER NOT NULL CHECK (total_qty >= 0),
    functional_qty INTEGER NOT NULL CHECK (functional_qty >= 0),
    CHECK (functional_qty <= total_qty)
);

-- ----------------------------------------------------------------------------
-- Table: vr_learning_logs
-- Offline-generated immersive session analytics with telemetry.
-- Created locally on VR headsets/tablets and synchronized centrally.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vr_learning_logs (
    log_id TEXT PRIMARY KEY, -- Client-generated UUID string
    student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    module_name TEXT NOT NULL CHECK (
        module_name IN ('Gravity', 'Friction', 'Quiz')
    ),
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    response_time_sec REAL NOT NULL CHECK (response_time_sec > 0),
    mastery_level TEXT NOT NULL CHECK (
        mastery_level IN ('Beginner', 'Intermediate', 'Advanced')
    ),
    synced_flag INTEGER NOT NULL DEFAULT 0 CHECK (synced_flag IN (0, 1)),
    created_at TEXT NOT NULL -- ISO-8601 string: YYYY-MM-DDTHH:MM:SSZ
);

-- ----------------------------------------------------------------------------
-- Indexes for Foreign Key Joins & Offline Sync Queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_educational_resources_school_id ON educational_resources(school_id);
CREATE INDEX IF NOT EXISTS idx_vr_learning_logs_student_id ON vr_learning_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_vr_learning_logs_synced_flag ON vr_learning_logs(synced_flag);
CREATE INDEX IF NOT EXISTS idx_vr_learning_logs_created_at ON vr_learning_logs(created_at);
