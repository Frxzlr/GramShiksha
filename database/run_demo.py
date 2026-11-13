#!/usr/bin/env python3
"""
GramShiksha End-to-End Database & ACID Sync Demonstration
Executes:
1. Fresh database initialization and local edge seeding.
2. Unsynced inspection.
3. Mid-sync simulated network drop (fail_after=40) verifying atomic rollback on Central and Local.
4. Clean full synchronization.
5. Idempotent re-sync verification (zero duplicate rows).
6. Analytical SQL reports (Infrastructure Deficit & Learning Velocity Ranking).
7. Relational integrity enforcement (FOREIGN KEY and CHECK violations).
"""

import os
import sys
import sqlite3
from sync_manager import sync_unsynced

DB_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")
SEED_PATH = os.path.join(DB_DIR, "seed.sql")
LOCAL_DB = os.path.join(DB_DIR, "local.db")
CENTRAL_DB = os.path.join(DB_DIR, "central.db")
ANALYTICS_SQL_PATH = os.path.join(DB_DIR, "analytics_queries.sql")


def print_header(title: str):
    print("\n" + "=" * 78)
    print(f" {title.upper()}")
    print("=" * 78)


def print_step(step_num: str, title: str):
    print(f"\n[{step_num}] {title}")
    print("-" * 78)


def remove_db_files():
    """Ensure clean repeatable state."""
    for db_file in [LOCAL_DB, CENTRAL_DB]:
        for ext in ["", "-journal", "-wal", "-shm"]:
            path = db_file + ext
            if os.path.exists(path):
                os.remove(path)


def format_table(headers, rows):
    """Simple ASCII table formatter."""
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(val) if val is not None else "NULL"))
    
    header_str = " | ".join(f"{h:<{col_widths[i]}}" for i, h in enumerate(headers))
    sep_str = "-+-".join("-" * col_widths[i] for i in range(len(headers)))
    out = [header_str, sep_str]
    for row in rows:
        r_str = " | ".join(f"{str(v) if v is not None else 'NULL':<{col_widths[i]}}" for i, v in enumerate(row))
        out.append(r_str)
    return "\n".join(out)


def main():
    print_header("GramShiksha: Rural Education VR & Resource Platform ACID Demo")

    # -------------------------------------------------------------------------
    # Step A: Initialize local and central SQLite databases
    # -------------------------------------------------------------------------
    print_step("STEP A", "Database Initialization & Local Edge Seeding")
    remove_db_files()
    print(f"Cleaned up previous database files: {LOCAL_DB}, {CENTRAL_DB}")

    # Read schema
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Read seed
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        seed_sql = f.read()

    # Create local DB with schema and seed
    conn_local = sqlite3.connect(LOCAL_DB)
    conn_local.execute("PRAGMA foreign_keys = ON;")
    conn_local.executescript(schema_sql)
    conn_local.executescript(seed_sql)
    conn_local.close()

    # Create central DB with schema only
    conn_central = sqlite3.connect(CENTRAL_DB)
    conn_central.execute("PRAGMA foreign_keys = ON;")
    conn_central.executescript(schema_sql)
    conn_central.close()

    print("✓ Local edge DB initialized with schema and seed data.")
    print("✓ Central server DB initialized with empty schema.")

    # -------------------------------------------------------------------------
    # Step B: Show initial counts
    # -------------------------------------------------------------------------
    print_step("STEP B", "Pre-Sync State Verification")
    conn_local = sqlite3.connect(LOCAL_DB)
    cur = conn_local.execute("SELECT COUNT(*) FROM vr_learning_logs WHERE synced_flag = 0")
    local_unsynced = cur.fetchone()[0]
    conn_local.close()

    conn_central = sqlite3.connect(CENTRAL_DB)
    cur = conn_central.execute("SELECT COUNT(*) FROM vr_learning_logs")
    central_total = cur.fetchone()[0]
    conn_central.close()

    print(f"• Local Edge DB Unsynced Logs : {local_unsynced}")
    print(f"• Central Server DB Logs       : {central_total}")

    # -------------------------------------------------------------------------
    # Step C: Mid-Sync Simulated Network Failure (fail_after=40)
    # -------------------------------------------------------------------------
    print_step("STEP C", "ACID Rollback Test: Simulated Mid-Sync Connection Drop (fail_after=40)")
    print("Initiating batch sync (batch_size=25) with simulated network cut at row 40...")

    try:
        sync_unsynced(LOCAL_DB, CENTRAL_DB, batch_size=25, fail_after=40)
        print("ERROR: Sync was expected to fail, but succeeded unexpectedly!")
        sys.exit(1)
    except ConnectionError as e:
        print(f"✓ Network interruption simulated successfully: {e}")

    # Verify rollback in central.db
    conn_central = sqlite3.connect(CENTRAL_DB)
    cur = conn_central.execute("SELECT COUNT(*) FROM vr_learning_logs")
    central_after_abort = cur.fetchone()[0]
    conn_central.close()

    # Verify local.db synced_flag
    conn_local = sqlite3.connect(LOCAL_DB)
    cur = conn_local.execute("SELECT COUNT(*) FROM vr_learning_logs WHERE synced_flag = 0")
    local_unsynced_after_abort = cur.fetchone()[0]
    conn_local.close()

    print(f"• Central DB Row Count After Abort : {central_after_abort} (Expected: 0)")
    print(f"• Local DB Unsynced Count           : {local_unsynced_after_abort} (Expected: 150)")

    if central_after_abort == 0 and local_unsynced_after_abort == 150:
        print(">>> ACID PROOF: Central transaction completely rolled back; 0 partial rows persisted.")
        print(">>> ACID PROOF: Local synced_flag remained untouched at 0.")
    else:
        print("ERROR: ACID rollback verification failed!")
        sys.exit(1)

    # -------------------------------------------------------------------------
    # Step D: Clean Full Sync
    # -------------------------------------------------------------------------
    print_step("STEP D", "Full Synchronization (No Network Drop)")
    result = sync_unsynced(LOCAL_DB, CENTRAL_DB, batch_size=25, fail_after=None)
    print(f"• Sync Result: {result}")

    conn_central = sqlite3.connect(CENTRAL_DB)
    cur = conn_central.execute("SELECT COUNT(*) FROM vr_learning_logs")
    central_synced_count = cur.fetchone()[0]
    conn_central.close()

    conn_local = sqlite3.connect(LOCAL_DB)
    cur = conn_local.execute("SELECT COUNT(*) FROM vr_learning_logs WHERE synced_flag = 1")
    local_marked_synced = cur.fetchone()[0]
    cur = conn_local.execute("SELECT COUNT(*) FROM vr_learning_logs WHERE synced_flag = 0")
    local_marked_unsynced = cur.fetchone()[0]
    conn_local.close()

    print(f"• Central DB Logs Stored : {central_synced_count} (Expected: 150)")
    print(f"• Local DB Synced Flags  : {local_marked_synced} (synced=1), {local_marked_unsynced} (synced=0)")
    assert central_synced_count == 150, "Central sync count mismatch!"
    assert local_marked_synced == 150, "Local sync flag count mismatch!"
    print("✓ Full sync completed with two-phase commit ordering.")

    # -------------------------------------------------------------------------
    # Step E: Idempotent Re-sync (Duplicate Prevention)
    # -------------------------------------------------------------------------
    print_step("STEP E", "Idempotent Re-sync Verification")
    re_result = sync_unsynced(LOCAL_DB, CENTRAL_DB, batch_size=25, fail_after=None)
    print(f"• Re-sync Result: {re_result}")

    conn_central = sqlite3.connect(CENTRAL_DB)
    cur = conn_central.execute("SELECT COUNT(*) FROM vr_learning_logs")
    central_resync_count = cur.fetchone()[0]
    conn_central.close()

    print(f"• Central DB Logs Stored : {central_resync_count} (Expected: 150)")
    assert central_resync_count == 150, "Duplicate rows detected!"
    print("✓ Idempotency verified: re-sync performed zero duplicate writes.")

    # -------------------------------------------------------------------------
    # Step F: Run Analytics Queries on Central DB
    # -------------------------------------------------------------------------
    print_step("STEP F", "Central Analytics Queries")

    conn_central = sqlite3.connect(CENTRAL_DB)

    # Query 1: Infrastructure Deficit
    q1 = """
    WITH student_counts AS (
        SELECT school_id, COUNT(student_id) AS total_students
        FROM students GROUP BY school_id
    ),
    resource_counts AS (
        SELECT school_id,
            COALESCE(SUM(CASE WHEN item_type = 'Science Kit' THEN functional_qty ELSE 0 END), 0) AS functional_kits,
            COALESCE(SUM(CASE WHEN item_type = 'Science Kit' THEN total_qty ELSE 0 END), 0) AS total_kits
        FROM educational_resources GROUP BY school_id
    )
    SELECT
        s.school_id,
        s.name AS school_name,
        s.district,
        s.connectivity_status,
        COALESCE(sc.total_students, 0) AS students,
        COALESCE(rc.functional_kits, 0) AS func_kits,
        ROUND(CAST(sc.total_students AS REAL) / NULLIF(rc.functional_kits, 0), 2) AS students_per_kit,
        CASE
            WHEN COALESCE(rc.functional_kits, 0) = 0 OR (CAST(sc.total_students AS REAL) / NULLIF(rc.functional_kits, 0)) > 20.0
                THEN 'Critical Deficit'
            WHEN (CAST(sc.total_students AS REAL) / NULLIF(rc.functional_kits, 0)) >= 10.0
                THEN 'Moderate Need'
            ELSE 'Adequate'
        END AS deficit_status
    FROM schools s
    LEFT JOIN student_counts sc ON s.school_id = sc.school_id
    LEFT JOIN resource_counts rc ON s.school_id = rc.school_id
    GROUP BY s.school_id
    HAVING COALESCE(sc.total_students, 0) >= 1
    ORDER BY
        CASE WHEN COALESCE(rc.functional_kits, 0) = 0 THEN 999999 ELSE (CAST(sc.total_students AS REAL) / rc.functional_kits) END DESC,
        sc.total_students DESC;
    """

    print("\n--- QUERY 1: INFRASTRUCTURE DEFICIT REPORT (Worst-Equipped First) ---")
    headers_q1 = ["School ID", "School Name", "District", "Network", "Students", "Func Kits", "Ratio (Stu/Kit)", "Classification"]
    rows_q1 = conn_central.execute(q1).fetchall()
    print(format_table(headers_q1, rows_q1))

    # Query 2: Learning Velocity
    q2 = """
    WITH session_window AS (
        SELECT
            l.log_id,
            l.student_id,
            s.school_id,
            sch.district,
            l.module_name,
            l.score,
            l.created_at,
            LAG(l.score) OVER (PARTITION BY l.student_id ORDER BY l.created_at) AS prev_score,
            AVG(l.score) OVER (
                PARTITION BY l.student_id ORDER BY l.created_at
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ) AS moving_avg,
            l.score - LAG(l.score, 2) OVER (PARTITION BY l.student_id ORDER BY l.created_at) AS gain,
            ROW_NUMBER() OVER (PARTITION BY l.student_id ORDER BY l.created_at DESC) AS recency
        FROM vr_learning_logs l
        JOIN students s ON l.student_id = s.student_id
        JOIN schools sch ON s.school_id = sch.school_id
    ),
    student_summary AS (
        SELECT student_id, district, score AS final_score, moving_avg, gain
        FROM session_window
        WHERE recency = 1 AND gain IS NOT NULL
    )
    SELECT
        district,
        COUNT(student_id) AS student_count,
        ROUND(AVG(final_score), 2) AS avg_final_score,
        ROUND(AVG(gain), 2) AS avg_learning_gain,
        DENSE_RANK() OVER (ORDER BY AVG(gain) DESC) AS district_rank
    FROM student_summary
    GROUP BY district
    ORDER BY district_rank ASC;
    """

    print("\n--- QUERY 2: LEARNING VELOCITY & DISTRICT RANKING ---")
    headers_q2 = ["District", "Learners", "Avg Final Score", "Avg Learning Gain (3-Sess)", "District Rank"]
    rows_q2 = conn_central.execute(q2).fetchall()
    print(format_table(headers_q2, rows_q2))

    # Sample session window calculations
    q2_sample = """
    WITH session_window AS (
        SELECT
            l.student_id,
            l.module_name,
            l.score,
            l.created_at,
            LAG(l.score) OVER (PARTITION BY l.student_id ORDER BY l.created_at) AS prev_score,
            ROUND(AVG(l.score) OVER (
                PARTITION BY l.student_id ORDER BY l.created_at
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ), 1) AS moving_avg,
            l.score - LAG(l.score, 2) OVER (PARTITION BY l.student_id ORDER BY l.created_at) AS net_gain
        FROM vr_learning_logs l
    )
    SELECT student_id, module_name, score, prev_score, moving_avg, net_gain, created_at
    FROM session_window
    LIMIT 6;
    """
    print("\n--- QUERY 2 DETAIL: SAMPLE WINDOW FUNCTIONS PER SESSION (LAG, MOVING AVG, GAIN) ---")
    headers_sample = ["Student ID", "Module", "Score", "Prev Score", "3-Sess Avg", "3-Sess Gain", "Timestamp"]
    rows_sample = conn_central.execute(q2_sample).fetchall()
    print(format_table(headers_sample, rows_sample))

    conn_central.close()

    # -------------------------------------------------------------------------
    # Step G: Relational Integrity Demonstration
    # -------------------------------------------------------------------------
    print_step("STEP G", "Relational Integrity Enforcement (FK & CHECK Constraints)")
    conn_central = sqlite3.connect(CENTRAL_DB)
    conn_central.execute("PRAGMA foreign_keys = ON;")

    # 1. Foreign Key Violation
    print("1. Attempting to insert a VR log for a nonexistent student_id ('STU-NONEXISTENT')...")
    try:
        conn_central.execute(
            """
            INSERT INTO vr_learning_logs (
                log_id, student_id, module_name, score, response_time_sec,
                mastery_level, synced_flag, created_at
            )
            VALUES ('err-fk-001', 'STU-NONEXISTENT', 'Gravity', 75, 20.0, 'Intermediate', 1, '2024-11-01T10:00:00Z')
            """
        )
        print("ERROR: Foreign Key constraint failed to trigger!")
        sys.exit(1)
    except sqlite3.IntegrityError as e:
        print(f"✓ FOREIGN KEY constraint enforced successfully: {e}")

    # 2. CHECK Constraint Violation (score = 150)
    print("2. Attempting to insert a VR log with score = 150 (valid range: 0..100)...")
    valid_student_cur = conn_central.execute("SELECT student_id FROM students LIMIT 1")
    valid_student_id = valid_student_cur.fetchone()[0]
    try:
        conn_central.execute(
            f"""
            INSERT INTO vr_learning_logs (
                log_id, student_id, module_name, score, response_time_sec,
                mastery_level, synced_flag, created_at
            )
            VALUES ('err-chk-001', '{valid_student_id}', 'Gravity', 150, 20.0, 'Advanced', 1, '2024-11-01T10:00:00Z')
            """
        )
        print("ERROR: CHECK constraint failed to trigger!")
        sys.exit(1)
    except sqlite3.IntegrityError as e:
        print(f"✓ CHECK constraint enforced successfully: {e}")

    conn_central.close()

    print_header("Demo Complete: All ACID, Analytics, and Relational Tests Passed Cleanly!")


if __name__ == "__main__":
    main()
