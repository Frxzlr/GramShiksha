#!/usr/bin/env python3
"""
Seed Data Generator for GramShiksha Relational Layer
Generates realistic Indian rural education data for SQLite/Postgres.
Outputs database/seed.sql.
"""

import uuid
import datetime
import os

def generate_seed():
    schools = [
        ('SCH-UP-001', 'Govt Upper Primary School Maholi', 'Sitapur', 'Poor'),
        ('SCH-UP-002', 'Govt Primary School Pisawan', 'Sitapur', 'None'),
        ('SCH-RJ-001', 'Rajkiya Madhyamik Vidyalaya Chohtan', 'Barmer', 'Moderate'),
        ('SCH-RJ-002', 'Govt Upper Primary School Sheo', 'Barmer', 'Poor'),
        ('SCH-MH-001', 'Zilla Parishad High School Dhanora', 'Gadchiroli', 'None'),
        ('SCH-MH-002', 'Zilla Parishad Primary School Chamorshi', 'Gadchiroli', 'Good'),
    ]

    students = []
    for idx, (sch_id, _, _, _) in enumerate(schools):
        for s in range(1, 11):
            s_num = idx * 10 + s
            s_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"gramshiksha-student-{s_num}"))
            grade = 6 + (s % 3)  # Grades 6, 7, 8
            students.append((s_id, sch_id, grade))

    resources = [
        # Sitapur - Maholi: under-equipped
        ('RES-001', 'SCH-UP-001', 'Science Kit', 5, 1),
        ('RES-002', 'SCH-UP-001', 'Tablet', 10, 4),
        ('RES-003', 'SCH-UP-001', 'VR Headset', 4, 1),
        ('RES-004', 'SCH-UP-001', 'Textbook', 100, 80),
        ('RES-005', 'SCH-UP-001', 'Solar Charger', 3, 2),

        # Sitapur - Pisawan: critical shortage, 0 VR headsets, 0 functional science kits
        ('RES-006', 'SCH-UP-002', 'Science Kit', 4, 0),
        ('RES-007', 'SCH-UP-002', 'Tablet', 5, 0),
        ('RES-008', 'SCH-UP-002', 'VR Headset', 0, 0),
        ('RES-009', 'SCH-UP-002', 'Textbook', 80, 40),
        ('RES-010', 'SCH-UP-002', 'Projector', 1, 0),

        # Barmer - Chohtan: well supported
        ('RES-011', 'SCH-RJ-001', 'Science Kit', 6, 3),
        ('RES-012', 'SCH-RJ-001', 'Tablet', 15, 12),
        ('RES-013', 'SCH-RJ-001', 'VR Headset', 6, 5),
        ('RES-014', 'SCH-RJ-001', 'Textbook', 120, 115),
        ('RES-015', 'SCH-RJ-001', 'Solar Charger', 4, 4),

        # Barmer - Sheo: moderate need
        ('RES-016', 'SCH-RJ-002', 'Science Kit', 4, 1),
        ('RES-017', 'SCH-RJ-002', 'Tablet', 8, 3),
        ('RES-018', 'SCH-RJ-002', 'VR Headset', 2, 1),
        ('RES-019', 'SCH-RJ-002', 'Textbook', 90, 60),
        ('RES-020', 'SCH-RJ-002', 'Projector', 2, 1),

        # Gadchiroli - Dhanora: tribal region, severe shortage, 0 VR headsets
        ('RES-021', 'SCH-MH-001', 'Science Kit', 3, 0),
        ('RES-022', 'SCH-MH-001', 'Tablet', 4, 1),
        ('RES-023', 'SCH-MH-001', 'VR Headset', 0, 0),
        ('RES-024', 'SCH-MH-001', 'Textbook', 70, 35),
        ('RES-025', 'SCH-MH-001', 'Solar Charger', 2, 1),

        # Gadchiroli - Chamorshi: model school with good resources
        ('RES-026', 'SCH-MH-002', 'Science Kit', 8, 6),
        ('RES-027', 'SCH-MH-002', 'Tablet', 20, 18),
        ('RES-028', 'SCH-MH-002', 'VR Headset', 8, 7),
        ('RES-029', 'SCH-MH-002', 'Textbook', 150, 145),
        ('RES-030', 'SCH-MH-002', 'Projector', 3, 3),
    ]

    # Generate 150 VR learning logs (50 students * 3 sessions each)
    logs = []
    modules = ['Gravity', 'Friction', 'Quiz']
    base_date = datetime.datetime(2024, 9, 1, 9, 30, 0)

    log_count = 0
    for s_idx in range(50):
        stu_id, sch_id, grade = students[s_idx]
        sch = next(s for s in schools if s[0] == sch_id)
        district = sch[2]

        for sess in range(3):
            log_count += 1
            log_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"gramshiksha-log-{log_count}"))
            sess_date = base_date + datetime.timedelta(
                days=(sess * 14) + (s_idx % 7),
                hours=(s_idx % 5),
                minutes=(sess * 20)
            )
            created_at = sess_date.strftime('%Y-%m-%dT%H:%M:%SZ')
            mod_name = modules[sess % len(modules)]

            # Score trajectories:
            # - Barmer: strong learning velocity
            # - Gadchiroli: Chamorshi high gain, Dhanora modest gain
            # - Sitapur: mixed (some improve, some stay flat or slight decline)
            if district == 'Barmer':
                score = 52 + (sess * 18) + (s_idx % 5)
            elif district == 'Gadchiroli':
                if sch_id == 'SCH-MH-002':
                    score = 58 + (sess * 15) + (s_idx % 4)
                else:
                    score = 44 + (sess * 8) - (s_idx % 3)
            else:  # Sitapur
                if s_idx % 2 == 0:
                    score = 46 + (sess * 7) + (s_idx % 4)
                else:
                    score = 54 - (sess * 4) + (s_idx % 3)

            score = max(0, min(100, score))

            if score >= 80:
                mastery = 'Advanced'
            elif score >= 60:
                mastery = 'Intermediate'
            else:
                mastery = 'Beginner'

            resp_time = round(max(8.0, 48.0 - (score * 0.35) + ((s_idx + sess) % 4)), 2)
            # Seeded logs in local db have synced_flag = 0
            logs.append((log_id, stu_id, mod_name, score, resp_time, mastery, 0, created_at))

    out_lines = [
        "-- ============================================================================",
        "-- GramShiksha Seed Data (Realistic Rural Indian Schools & VR Labs)",
        "-- Deterministic UUIDs and 150 unsynced VR learning logs (synced_flag = 0)",
        "-- ============================================================================",
        "",
        "-- Schools",
    ]

    for s in schools:
        out_lines.append(
            f"INSERT INTO schools (school_id, name, district, connectivity_status) "
            f"VALUES ('{s[0]}', '{s[1]}', '{s[2]}', '{s[3]}');"
        )

    out_lines.append("\n-- Students (60 students across 6 schools)")
    for stu in students:
        out_lines.append(
            f"INSERT INTO students (student_id, school_id, grade) "
            f"VALUES ('{stu[0]}', '{stu[1]}', {stu[2]});"
        )

    out_lines.append("\n-- Educational Resources (30 resource allocations)")
    for r in resources:
        out_lines.append(
            f"INSERT INTO educational_resources (resource_id, school_id, item_type, total_qty, functional_qty) "
            f"VALUES ('{r[0]}', '{r[1]}', '{r[2]}', {r[3]}, {r[4]});"
        )

    out_lines.append("\n-- VR Learning Logs (150 logs, synced_flag = 0)")
    for l in logs:
        out_lines.append(
            f"INSERT INTO vr_learning_logs (log_id, student_id, module_name, score, response_time_sec, mastery_level, synced_flag, created_at) "
            f"VALUES ('{l[0]}', '{l[1]}', '{l[2]}', {l[3]}, {l[4]}, '{l[5]}', {l[6]}, '{l[7]}');"
        )

    target_file = os.path.join(os.path.dirname(__file__), "seed.sql")
    with open(target_file, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines) + "\n")
    print(f"Wrote {len(schools)} schools, {len(students)} students, {len(resources)} resources, {len(logs)} logs to {target_file}")

if __name__ == "__main__":
    generate_seed()
