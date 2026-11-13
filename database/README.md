# GramShiksha: Relational Data Layer & ACID Offline-to-Central Sync Engine

A normalized relational database layer and offline-first synchronization engine designed for rural Indian schools operating in low- or zero-connectivity environments. Built using pure **Python 3 standard library** (`sqlite3`, `uuid`, `json`, `argparse`) with zero external pip dependencies.

---

## Architecture & Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    schools ||--o{ students : "enrolls (1:N)"
    schools ||--o{ educational_resources : "allocates (1:N)"
    students ||--o{ vr_learning_logs : "records (1:N)"

    schools {
        text school_id PK "e.g. SCH-UP-001"
        text name "Placename & institution"
        text district "Sitapur, Barmer, Gadchiroli"
        text connectivity_status "CHECK ('None','Poor','Moderate','Good')"
    }

    students {
        text student_id PK "Client UUID"
        text school_id FK "REFERENCES schools(school_id)"
        integer grade "CHECK (1..12)"
    }

    educational_resources {
        text resource_id PK "e.g. RES-001"
        text school_id FK "REFERENCES schools(school_id)"
        text item_type "CHECK ('Textbook','Tablet','VR Headset','Science Kit','Projector','Solar Charger')"
        integer total_qty "CHECK (total_qty >= 0)"
        integer functional_qty "CHECK (functional_qty >= 0 AND <= total_qty)"
    }

    vr_learning_logs {
        text log_id PK "Client-generated UUID"
        text student_id FK "REFERENCES students(student_id)"
        text module_name "CHECK ('Gravity','Friction','Quiz')"
        integer score "CHECK (0..100)"
        real response_time_sec "CHECK (> 0)"
        text mastery_level "CHECK ('Beginner','Intermediate','Advanced')"
        integer synced_flag "CHECK (0, 1) DEFAULT 0"
        text created_at "ISO-8601 Timestamp"
    }
```

---

## Quick Start & Verification

Run the complete end-to-end demonstration with one command:

```bash
python3 database/run_demo.py
```

### What `run_demo.py` Executes
1. **Database Initialization (`Step A`)**: Cleans any existing `.db` files, builds `local.db` and `central.db` from `database/schema.sql`, and loads `database/seed.sql` into `local.db`.
2. **Pre-Sync Inspection (`Step B`)**: Verifies 150 unsynced logs exist on the local edge database while the central server database has 0.
3. **Mid-Sync ACID Rollback Test (`Step C`)**: Initiates batch synchronization with `fail_after=40` simulating a sudden network drop mid-transfer. Demonstrates that:
   - Central database rolls back completely to 0 rows (atomicity preserved).
   - Local database preserves `synced_flag = 0` on all 150 rows.
4. **Clean Full Sync (`Step D`)**: Runs sync to completion. 150 rows are stored centrally, and only then marked `synced_flag = 1` locally.
5. **Idempotency Re-sync Test (`Step E`)**: Runs sync a 3rd time; verifies 0 writes, 0 duplicates, and exact 150 rows retained.
6. **Analytics Reports (`Step F`)**: Executes:
   - **Infrastructure Deficit Query**: Calculates student-to-functional-kit ratio without join fan-out, categorizing schools as *Critical Deficit*, *Moderate Need*, or *Adequate*.
   - **Learning Velocity Query**: Utilizes SQL window functions (`LAG`, 3-session `AVG() OVER (...)`, and `DENSE_RANK()`) to measure student gains and rank educational districts.
7. **Integrity Enforcement (`Step G`)**: Proves runtime rejection of `FOREIGN KEY` violations (invalid student ID) and `CHECK` violations (score = 150).

---

## Third Normal Form (3NF) Justification

The schema strictly adheres to 3NF principles to ensure data consistency, eliminate update anomalies, and conserve storage on constrained edge devices:

| Normal Form | Requirement | Implementation in GramShiksha |
| :--- | :--- | :--- |
| **1NF** | Atomic columns, unique rows, well-defined primary keys. | All attributes contain scalar values (no arrays or comma-delimited strings); every table has a single primary key (`school_id`, `student_id`, `resource_id`, `log_id`). |
| **2NF** | In 1NF and no non-key attribute depends on a partial candidate key. | All tables use single-column primary keys, removing any possibility of partial functional dependencies. |
| **3NF** | In 2NF and no transitive functional dependencies ($X \to Y$ where $Y \to Z$). | Attributes depending on the school (e.g. `district`, `connectivity_status`) exist strictly in `schools`. `students` and `educational_resources` reference `schools(school_id)` via foreign key rather than denormalizing school data into student rows. VR session telemetry only stores `student_id`, avoiding duplication of student or school data. |

---

## Mapping to the Offline-First PWA & VR Lab

1. **Edge-Native Autonomy**:
   - Rural schools in India often experience intermittent power and cellular connectivity (e.g., Sitapur or Gadchiroli villages with `None` or `Poor` connectivity status).
   - Standalone VR headsets and tablets record student interactions directly into local SQLite instances.
2. **Client-Generated UUIDs**:
   - The device assigns RFC 4122 UUIDs (`log_id`) at generation time without requiring a network handshake or central ID sequence.
3. **Opportunistic Synchronization**:
   - When a teacher's smartphone connects to a mobile hotspot or weekly sync station, `sync_manager.py` batches unsynced records and transmits them upstream.
4. **State-Level Decision Support**:
   - Central administrators query synchronized metrics to identify hardware deficits (e.g., allocating solar chargers and VR kits to schools with Critical Deficits) and track pedagogical effectiveness across districts.

---

## Sync Protocol & Transaction Safety

The synchronization engine in `database/sync_manager.py` implements a resilient protocol designed for volatile networks:

```mermaid
sequenceDiagram
    autonumber
    participant Local as Edge Device (local.db)
    participant Sync as Sync Manager
    participant Central as Central Server (central.db)

    Sync->>Local: Query unsynced rows (synced_flag = 0)
    Sync->>Central: Upsert parent entities (schools, students)
    Sync->>Central: BEGIN IMMEDIATE
    loop Each Batch (size = 25)
        Sync->>Central: SAVEPOINT sp_batch
        Sync->>Central: INSERT INTO vr_learning_logs ON CONFLICT(log_id) DO NOTHING
        alt Mid-batch Network Failure (fail_after)
            Sync->>Central: ROLLBACK TO sp_batch
            Sync->>Central: ROLLBACK (Outer Transaction)
            Note over Sync,Central: 0 partial records committed to Central!
        else Batch Success
            Sync->>Central: RELEASE sp_batch
        end
    end
    Sync->>Central: COMMIT (All Batches Succeeded)
    Note over Central: Central data safely persisted
    Sync->>Local: BEGIN IMMEDIATE
    Sync->>Local: UPDATE vr_learning_logs SET synced_flag = 1 WHERE log_id IN (...)
    Sync->>Local: COMMIT
    Note over Local: Local records marked synced
```

### Key Safety Guarantees
- **Atomic Rollback**: If a network failure occurs midway through transmission, the central database rolls back the transaction. No orphaned or partial batches are retained.
- **Commit-Then-Mark Ordering**: The local `synced_flag = 1` update occurs **strictly after** the central transaction has successfully committed. If the connection fails after central commit but before local flag update, the subsequent sync simply replays the records.
- **Idempotency via `ON CONFLICT DO NOTHING`**: Replaying previously synchronized records causes zero duplicates or errors because the central database deduplicates on `log_id`.

---

## PostgreSQL Compatibility

While SQLite provides edge storage, central servers can run PostgreSQL. Equivalent DDL is provided in `database/schema_postgres.sql`, with an optional adapter in `sync_manager.py`:

```python
# Guarded optional adapter:
from sync_manager import PostgresSyncManager

# Usage (if psycopg2 is installed):
# pg_sync = PostgresSyncManager("postgresql://user:pass@host:5432/gramshiksha")
# pg_sync.sync_from_local("database/local.db")
```

Key PostgreSQL differences:
- Native `UUID` and `TIMESTAMPTZ` data types.
- Native `BOOLEAN` for `synced_flag`.
- Native double precision floats for telemetry timings.
