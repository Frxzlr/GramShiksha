#!/usr/bin/env python3
"""
GramShiksha Offline-to-Central ACID Sync Manager
Implements transactional batching, savepoints, idempotent replay,
and mid-sync rollback on simulated connection drops.
"""

import sqlite3
import os
from typing import Optional, Dict, Any, List

# Optional PostgreSQL support guarded with try/except
try:
    import psycopg2
    import psycopg2.extras
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False


def _get_sqlite_connection(db_path: str) -> sqlite3.Connection:
    """
    Open SQLite connection with manual transaction control (isolation_level=None)
    and foreign keys enforced.
    """
    conn = sqlite3.connect(db_path, isolation_level=None)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn


def _upsert_parent_metadata(local_conn: sqlite3.Connection, central_conn: sqlite3.Connection):
    """
    Ensure parent tables (schools, students, educational_resources) exist
    in central DB before synchronizing VR logs, satisfying FOREIGN KEY constraints.
    """
    # 1. Schools
    cur = local_conn.execute("SELECT school_id, name, district, connectivity_status FROM schools")
    for row in cur.fetchall():
        central_conn.execute(
            """
            INSERT INTO schools (school_id, name, district, connectivity_status)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(school_id) DO UPDATE SET
                name = excluded.name,
                district = excluded.district,
                connectivity_status = excluded.connectivity_status
            """,
            (row["school_id"], row["name"], row["district"], row["connectivity_status"])
        )

    # 2. Students
    cur = local_conn.execute("SELECT student_id, school_id, grade FROM students")
    for row in cur.fetchall():
        central_conn.execute(
            """
            INSERT INTO students (student_id, school_id, grade)
            VALUES (?, ?, ?)
            ON CONFLICT(student_id) DO UPDATE SET
                grade = excluded.grade
            """,
            (row["student_id"], row["school_id"], row["grade"])
        )

    # 3. Educational Resources (needed for central infrastructure analytics)
    cur = local_conn.execute("SELECT resource_id, school_id, item_type, total_qty, functional_qty FROM educational_resources")
    for row in cur.fetchall():
        central_conn.execute(
            """
            INSERT INTO educational_resources (resource_id, school_id, item_type, total_qty, functional_qty)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(resource_id) DO UPDATE SET
                total_qty = excluded.total_qty,
                functional_qty = excluded.functional_qty
            """,
            (row["resource_id"], row["school_id"], row["item_type"], row["total_qty"], row["functional_qty"])
        )


def sync_unsynced(
    local_path: str,
    central_path: str,
    batch_size: int = 25,
    fail_after: Optional[int] = None
) -> Dict[str, Any]:
    """
    Synchronizes unsynced VR learning logs (synced_flag = 0) from local edge DB
    to central DB in transactional batches with savepoint recovery.

    Protocol:
    1. Parent entities (schools, students) are upserted first to satisfy FKs.
    2. Central transaction started with BEGIN IMMEDIATE.
    3. Process logs in chunks of batch_size, wrapped in individual SAVEPOINTs.
    4. If fail_after rows is exceeded, rollback to savepoint, rollback outer transaction,
       and raise ConnectionError to simulate connection drop.
    5. Rows inserted with ON CONFLICT(log_id) DO NOTHING for idempotency.
    6. COMMIT central transaction.
    7. ONLY AFTER central COMMIT succeeds, mark local records synced_flag = 1
       in an independent local transaction.
    """
    local_conn = _get_sqlite_connection(local_path)
    central_conn = _get_sqlite_connection(central_path)

    try:
        # First guarantee parent entities exist in central DB
        _upsert_parent_metadata(local_conn, central_conn)

        # Fetch unsynced records from edge device
        cur = local_conn.execute(
            """
            SELECT log_id, student_id, module_name, score, response_time_sec,
                   mastery_level, synced_flag, created_at
            FROM vr_learning_logs
            WHERE synced_flag = 0
            ORDER BY created_at ASC
            """
        )
        unsynced_rows = cur.fetchall()

        if not unsynced_rows:
            return {
                "attempted": 0,
                "inserted": 0,
                "skipped_duplicates": 0,
                "status": "success",
                "message": "Already up to date. Zero rows needed sync."
            }

        attempted = 0
        inserted = 0
        skipped_duplicates = 0
        successfully_synced_ids: List[str] = []

        # Begin outer transaction on Central DB
        central_conn.execute("BEGIN IMMEDIATE")

        try:
            total_rows = len(unsynced_rows)
            # Process in batches
            for batch_start in range(0, total_rows, batch_size):
                batch = unsynced_rows[batch_start:batch_start + batch_size]
                sp_name = f"sp_batch_{batch_start // batch_size}"
                central_conn.execute(f"SAVEPOINT {sp_name}")

                batch_synced_ids: List[str] = []
                try:
                    for row in batch:
                        if fail_after is not None and attempted >= fail_after:
                            # Simulate mid-sync network loss
                            raise ConnectionError(
                                f"Simulated network drop: connection severed after {attempted} rows!"
                            )

                        attempted += 1

                        # Check if central already has this log_id (idempotent duplicate check)
                        check_cur = central_conn.execute(
                            "SELECT 1 FROM vr_learning_logs WHERE log_id = ?",
                            (row["log_id"],)
                        )
                        is_duplicate = check_cur.fetchone() is not None

                        if is_duplicate:
                            skipped_duplicates += 1
                        else:
                            central_conn.execute(
                                """
                                INSERT INTO vr_learning_logs (
                                    log_id, student_id, module_name, score,
                                    response_time_sec, mastery_level, synced_flag, created_at
                                )
                                VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                                ON CONFLICT(log_id) DO NOTHING
                                """,
                                (
                                    row["log_id"], row["student_id"], row["module_name"],
                                    row["score"], row["response_time_sec"], row["mastery_level"],
                                    row["created_at"]
                                )
                            )
                            inserted += 1

                        batch_synced_ids.append(row["log_id"])

                    # Batch succeeded -> release savepoint
                    central_conn.execute(f"RELEASE {sp_name}")
                    successfully_synced_ids.extend(batch_synced_ids)

                except Exception as batch_err:
                    # Rollback batch savepoint and release
                    central_conn.execute(f"ROLLBACK TO {sp_name}")
                    central_conn.execute(f"RELEASE {sp_name}")
                    raise batch_err

            # Commit outer transaction on Central DB
            central_conn.execute("COMMIT")

        except Exception as outer_err:
            # Rollback entire central transaction
            central_conn.execute("ROLLBACK")
            raise outer_err

        # STEP 7: Only AFTER central COMMIT succeeds, mark rows as synced on local DB
        local_conn.execute("BEGIN IMMEDIATE")
        try:
            placeholders = ",".join("?" for _ in successfully_synced_ids)
            local_conn.execute(
                f"UPDATE vr_learning_logs SET synced_flag = 1 WHERE log_id IN ({placeholders})",
                successfully_synced_ids
            )
            local_conn.execute("COMMIT")
        except Exception as local_err:
            local_conn.execute("ROLLBACK")
            # Even if local update fails, central is intact and future syncs are idempotent
            raise RuntimeError(f"Central sync succeeded but local update failed: {local_err}")

        return {
            "attempted": attempted,
            "inserted": inserted,
            "skipped_duplicates": skipped_duplicates,
            "status": "success",
            "message": f"Successfully synchronized {inserted} rows ({skipped_duplicates} duplicates skipped)."
        }

    finally:
        local_conn.close()
        central_conn.close()


class PostgresSyncManager:
    """
    Optional PostgreSQL Central Adapter using psycopg2.
    Mirrors the exact ACID batching and savepoint recovery logic.
    """

    def __init__(self, dsn: str):
        if not PSYCOPG2_AVAILABLE:
            raise RuntimeError("psycopg2 is not installed. Install psycopg2 to use PostgreSQL sync.")
        self.dsn = dsn

    def sync_from_local(
        self,
        local_path: str,
        batch_size: int = 25,
        fail_after: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Synchronizes edge SQLite logs to a central PostgreSQL database.
        """
        local_conn = _get_sqlite_connection(local_path)
        pg_conn = psycopg2.connect(self.dsn)
        pg_conn.autocommit = False

        try:
            with pg_conn.cursor() as pg_cur:
                # 1. Upsert parents
                cur = local_conn.execute("SELECT school_id, name, district, connectivity_status FROM schools")
                for row in cur.fetchall():
                    pg_cur.execute(
                        """
                        INSERT INTO schools (school_id, name, district, connectivity_status)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (school_id) DO NOTHING;
                        """,
                        (row["school_id"], row["name"], row["district"], row["connectivity_status"])
                    )

                cur = local_conn.execute("SELECT student_id, school_id, grade FROM students")
                for row in cur.fetchall():
                    pg_cur.execute(
                        """
                        INSERT INTO students (student_id, school_id, grade)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (student_id) DO NOTHING;
                        """,
                        (row["student_id"], row["school_id"], row["grade"])
                    )

                # 2. Fetch unsynced
                cur = local_conn.execute(
                    "SELECT log_id, student_id, module_name, score, response_time_sec, "
                    "mastery_level, created_at FROM vr_learning_logs WHERE synced_flag = 0 ORDER BY created_at"
                )
                unsynced = cur.fetchall()

                attempted = 0
                inserted = 0
                skipped = 0
                synced_ids = []

                total_rows = len(unsynced)
                for start in range(0, total_rows, batch_size):
                    batch = unsynced[start:start + batch_size]
                    sp = f"sp_pg_batch_{start // batch_size}"
                    pg_cur.execute(f"SAVEPOINT {sp};")

                    try:
                        for row in batch:
                            if fail_after is not None and attempted >= fail_after:
                                raise ConnectionError(f"Simulated network drop after {attempted} rows")

                            attempted += 1
                            pg_cur.execute(
                                """
                                INSERT INTO vr_learning_logs (
                                    log_id, student_id, module_name, score,
                                    response_time_sec, mastery_level, synced_flag, created_at
                                )
                                VALUES (%s, %s, %s, %s, %s, %s, TRUE, %s)
                                ON CONFLICT (log_id) DO NOTHING;
                                """,
                                (
                                    row["log_id"], row["student_id"], row["module_name"],
                                    row["score"], row["response_time_sec"], row["mastery_level"],
                                    row["created_at"]
                                )
                            )
                            if pg_cur.rowcount > 0:
                                inserted += 1
                            else:
                                skipped += 1
                            synced_ids.append(row["log_id"])

                        pg_cur.execute(f"RELEASE SAVEPOINT {sp};")
                    except Exception as b_err:
                        pg_cur.execute(f"ROLLBACK TO SAVEPOINT {sp};")
                        raise b_err

            pg_conn.commit()

            # Mark local synced
            local_conn.execute("BEGIN IMMEDIATE")
            placeholders = ",".join("?" for _ in synced_ids)
            local_conn.execute(
                f"UPDATE vr_learning_logs SET synced_flag = 1 WHERE log_id IN ({placeholders})",
                synced_ids
            )
            local_conn.execute("COMMIT")

            return {
                "attempted": attempted,
                "inserted": inserted,
                "skipped_duplicates": skipped,
                "status": "success"
            }

        except Exception as e:
            pg_conn.rollback()
            raise e
        finally:
            pg_conn.close()
            local_conn.close()
