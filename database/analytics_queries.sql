-- ============================================================================
-- GramShiksha Rural Education VR & Resource Management Platform
-- Analytics Queries (SQLite 3.x and PostgreSQL Compatible)
-- ============================================================================
-- Dialect & Compatibility Notes:
-- 1. Window Functions:
--    Both SQLite (>= 3.25) and PostgreSQL natively support window functions
--    including LAG(), AVG() OVER (...), ROW_NUMBER(), and DENSE_RANK().
-- 2. Division & Type Casting:
--    In both dialects, dividing integers truncates to integer.
--    `CAST(val AS REAL)` (SQLite) or `CAST(val AS DOUBLE PRECISION)` / `::NUMERIC` (Postgres)
--    ensures floating-point division. `CAST(... AS REAL)` is supported by both.
-- 3. Divide by Zero Protection:
--    `NULLIF(expr, 0)` turns zero denominators into NULL, preventing division-by-zero
--    exceptions across both SQLite and PostgreSQL.
-- 4. CTE Aggregation (Anti-Fan-Out):
--    Separating students and resources into dedicated Common Table Expressions (CTEs)
--    prevents Cartesian multiplication (N x M fan-out) when joining multiple 1-to-many relationships.
-- ============================================================================

-- ============================================================================
-- Query 1: Infrastructure Deficit Analysis
-- ============================================================================
-- Problem Statement:
--   Evaluate educational hardware deficit per school without join fan-out.
--   Computes student-to-functional-kit ratio and classifies urgency:
--     - 'Critical Deficit': > 20.0 students per kit (or 0 functional kits available)
--     - 'Moderate Need':    10.0 to 20.0 students per kit
--     - 'Adequate':         < 10.0 students per kit
--   Ordered worst-equipped school first.
-- ============================================================================

WITH student_counts AS (
    SELECT
        school_id,
        COUNT(student_id) AS total_students
    FROM students
    GROUP BY school_id
),
resource_counts AS (
    SELECT
        school_id,
        COALESCE(SUM(CASE WHEN item_type = 'Science Kit' THEN functional_qty ELSE 0 END), 0) AS functional_kits,
        COALESCE(SUM(CASE WHEN item_type = 'Science Kit' THEN total_qty ELSE 0 END), 0) AS total_kits,
        COALESCE(SUM(CASE WHEN item_type = 'VR Headset' THEN functional_qty ELSE 0 END), 0) AS functional_vr_headsets,
        COALESCE(SUM(CASE WHEN item_type = 'Tablet' THEN functional_qty ELSE 0 END), 0) AS functional_tablets
    FROM educational_resources
    GROUP BY school_id
)
SELECT
    s.school_id,
    s.name AS school_name,
    s.district,
    s.connectivity_status,
    COALESCE(sc.total_students, 0) AS total_students,
    COALESCE(rc.functional_kits, 0) AS functional_kits,
    ROUND(CAST(sc.total_students AS REAL) / NULLIF(rc.functional_kits, 0), 2) AS students_per_functional_kit,
    CASE
        WHEN COALESCE(rc.functional_kits, 0) = 0 OR (CAST(sc.total_students AS REAL) / NULLIF(rc.functional_kits, 0)) > 20.0
            THEN 'Critical Deficit'
        WHEN (CAST(sc.total_students AS REAL) / NULLIF(rc.functional_kits, 0)) >= 10.0
            THEN 'Moderate Need'
        ELSE 'Adequate'
    END AS deficit_classification
FROM schools s
LEFT JOIN student_counts sc ON s.school_id = sc.school_id
LEFT JOIN resource_counts rc ON s.school_id = rc.school_id
GROUP BY s.school_id
HAVING COALESCE(sc.total_students, 0) >= 1
ORDER BY
    CASE
        WHEN COALESCE(rc.functional_kits, 0) = 0 THEN 999999
        ELSE (CAST(sc.total_students AS REAL) / rc.functional_kits)
    END DESC,
    sc.total_students DESC;


-- ============================================================================
-- Query 2: Learning Velocity and District Ranking
-- ============================================================================
-- Problem Statement:
--   Calculate session-over-session learning gains using window functions:
--   1. LAG(score) for prior session score.
--   2. Moving average over 3 sessions: AVG(score) OVER (... ROWS BETWEEN 2 PRECEDING AND CURRENT ROW).
--   3. Learning improvement over each student's 3-session window.
--   4. Aggregate learning velocity by district and rank with DENSE_RANK().
-- ============================================================================

WITH session_window AS (
    SELECT
        l.log_id,
        l.student_id,
        s.school_id,
        sch.district,
        l.module_name,
        l.score,
        l.created_at,
        -- Previous session score
        LAG(l.score) OVER (
            PARTITION BY l.student_id
            ORDER BY l.created_at
        ) AS prev_session_score,
        -- 3-session moving average
        AVG(l.score) OVER (
            PARTITION BY l.student_id
            ORDER BY l.created_at
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) AS moving_avg_score,
        -- Net score gain across the 3 sessions (current score minus score 2 sessions ago)
        l.score - LAG(l.score, 2) OVER (
            PARTITION BY l.student_id
            ORDER BY l.created_at
        ) AS three_session_gain,
        -- Row rank to identify the latest session per student
        ROW_NUMBER() OVER (
            PARTITION BY l.student_id
            ORDER BY l.created_at DESC
        ) AS recency_rank
    FROM vr_learning_logs l
    JOIN students s ON l.student_id = s.student_id
    JOIN schools sch ON s.school_id = sch.school_id
),
student_summary AS (
    SELECT
        student_id,
        district,
        score AS final_score,
        moving_avg_score,
        three_session_gain
    FROM session_window
    WHERE recency_rank = 1 AND three_session_gain IS NOT NULL
)
SELECT
    district,
    COUNT(student_id) AS student_count,
    ROUND(AVG(final_score), 2) AS avg_final_score,
    ROUND(AVG(three_session_gain), 2) AS avg_learning_gain,
    DENSE_RANK() OVER (ORDER BY AVG(three_session_gain) DESC) AS district_rank
FROM student_summary
GROUP BY district
ORDER BY district_rank ASC;
