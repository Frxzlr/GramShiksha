-- ============================================================================
-- GramShiksha Rural Education VR & Resource Management Platform
-- Relational Database Schema (PostgreSQL Dialect)
-- ============================================================================
-- PostgreSQL-Specific Features Utilized:
-- 1. Native UUID type for primary keys (can also use TEXT or VARCHAR).
-- 2. Native TIMESTAMPTZ for timezone-aware created_at timestamps.
-- 3. Native BOOLEAN for synced_flag (DEFAULT FALSE).
-- 4. Native DOUBLE PRECISION for response_time_sec.
-- 5. Foreign keys are enforced by default with ON DELETE RESTRICT.
-- ============================================================================

-- Create tables

CREATE TABLE IF NOT EXISTS schools (
    school_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    connectivity_status VARCHAR(20) NOT NULL CHECK (
        connectivity_status IN ('None', 'Poor', 'Moderate', 'Good')
    )
);

CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(64) PRIMARY KEY,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12)
);

CREATE TABLE IF NOT EXISTS educational_resources (
    resource_id VARCHAR(64) PRIMARY KEY,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
    item_type VARCHAR(50) NOT NULL CHECK (
        item_type IN ('Textbook', 'Tablet', 'VR Headset', 'Science Kit', 'Projector', 'Solar Charger')
    ),
    total_qty INTEGER NOT NULL CHECK (total_qty >= 0),
    functional_qty INTEGER NOT NULL CHECK (functional_qty >= 0),
    CHECK (functional_qty <= total_qty)
);

CREATE TABLE IF NOT EXISTS vr_learning_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    module_name VARCHAR(50) NOT NULL CHECK (
        module_name IN ('Gravity', 'Friction', 'Quiz')
    ),
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    response_time_sec DOUBLE PRECISION NOT NULL CHECK (response_time_sec > 0),
    mastery_level VARCHAR(20) NOT NULL CHECK (
        mastery_level IN ('Beginner', 'Intermediate', 'Advanced')
    ),
    synced_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pg_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_pg_educational_resources_school_id ON educational_resources(school_id);
CREATE INDEX IF NOT EXISTS idx_pg_vr_learning_logs_student_id ON vr_learning_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_pg_vr_learning_logs_synced_flag ON vr_learning_logs(synced_flag);
CREATE INDEX IF NOT EXISTS idx_pg_vr_learning_logs_created_at ON vr_learning_logs(created_at);
