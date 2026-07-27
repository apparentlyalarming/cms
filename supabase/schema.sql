-- ============================================================
-- Smart Campus Management Portal — Full Supabase Schema
-- ============================================================
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ------------------------------------------------------------
-- 0. Extensions
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

-- 1a. profiles — one row per auth user, created by the trigger below
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1b. students — extended info for users with role = 'student'
CREATE TABLE IF NOT EXISTS students (
  student_id   UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  roll_number  TEXT UNIQUE NOT NULL,
  department   TEXT NOT NULL DEFAULT 'Computer Science',
  semester     INT NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 8),
  gpa          NUMERIC(3,2) DEFAULT 0.00,
  total_credits INT DEFAULT 0
);

-- 1c. faculty — extended info for users with role = 'faculty'
CREATE TABLE IF NOT EXISTS faculty (
  faculty_id  UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  department  TEXT NOT NULL DEFAULT 'Computer Science',
  designation TEXT NOT NULL DEFAULT 'Assistant Professor'
);

-- 1d. courses
CREATE TABLE IF NOT EXISTS courses (
  course_id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  department  TEXT NOT NULL DEFAULT 'Computer Science',
  credits     INT NOT NULL DEFAULT 3 CHECK (credits > 0)
);

-- 1e. enrollments — which student is taking which course
CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed')),
  enrolled_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, course_id)
);

-- 1f. attendance — per-subject, per-date records
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  class_date    DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (enrollment_id, class_date)
);

-- 1g. timetable — weekly class slots
CREATE TABLE IF NOT EXISTS timetable (
  slot_id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  period      INT NOT NULL CHECK (period BETWEEN 1 AND 8),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  room        TEXT,
  slot_type   TEXT NOT NULL DEFAULT 'lecture' CHECK (slot_type IN ('lecture','lab','tutorial'))
);

-- 1h. fees
CREATE TABLE IF NOT EXISTS fees (
  fee_id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  item_name   TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  paid        BOOLEAN DEFAULT false,
  due_date    DATE,
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 1i. fee_payments — payment history ledger
CREATE TABLE IF NOT EXISTS fee_payments (
  payment_id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  ref_number   TEXT UNIQUE NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 1j. hostel_rooms
CREATE TABLE IF NOT EXISTS hostel_rooms (
  room_id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL,
  block       TEXT NOT NULL,
  room_type   TEXT NOT NULL DEFAULT 'Single' CHECK (room_type IN ('Single','Double','Triple')),
  capacity    INT NOT NULL DEFAULT 1 CHECK (capacity > 0),
  occupied    INT NOT NULL DEFAULT 0 CHECK (occupied >= 0),
  warden      TEXT
);

-- 1k. hostel_assignments
CREATE TABLE IF NOT EXISTS hostel_assignments (
  assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  room_id       UUID NOT NULL REFERENCES hostel_rooms(room_id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id)
);

-- 1l. hostel_pass_requests
CREATE TABLE IF NOT EXISTS hostel_pass_requests (
  request_id  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  pass_type   TEXT NOT NULL CHECK (pass_type IN ('Night Out','Home Leave','Late Entry','Day Out')),
  request_date DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 1m. events
CREATE TABLE IF NOT EXISTS events (
  event_id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  event_time  TEXT,
  venue       TEXT,
  category    TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('Technical','Cultural','Workshop','Sports','General')),
  total_seats INT NOT NULL DEFAULT 100,
  filled_seats INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 1n. event_registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  registration_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  registered_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, student_id)
);

-- 1o. circulars — official notices / notice board
CREATE TABLE IF NOT EXISTS circulars (
  circular_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('high','medium','low')),
  category    TEXT NOT NULL DEFAULT 'General',
  attachment  TEXT,
  posted_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 1p. performance — quiz / assignment / exam scores per enrollment
CREATE TABLE IF NOT EXISTS performance (
  performance_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id  UUID NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz','assignment','midsem','endsem')),
  label          TEXT,
  score          NUMERIC(5,2) NOT NULL CHECK (score >= 0),
  max_score      NUMERIC(5,2) NOT NULL DEFAULT 100,
  created_at     TIMESTAMPTZ DEFAULT now()
);


-- ------------------------------------------------------------
-- 2. ROW LEVEL SECURITY — enable on every table
-- ------------------------------------------------------------

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty               ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable             ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_pass_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE circulars             ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance           ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 3. RLS POLICIES
-- ------------------------------------------------------------

-- 3a. profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Faculty can see all profiles (for dashboards / lookups)
CREATE POLICY "Faculty can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3b. students
CREATE POLICY "Students can read own record"
  ON students FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Faculty can read all students"
  ON students FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

CREATE POLICY "Students can update own record"
  ON students FOR UPDATE USING (auth.uid() = student_id);

-- 3c. faculty
CREATE POLICY "Faculty can read own record"
  ON faculty FOR SELECT USING (auth.uid() = faculty_id);

CREATE POLICY "Students can read faculty list"
  ON faculty FOR SELECT USING (true);

-- 3d. courses — readable by everyone, write by faculty
CREATE POLICY "Anyone can read courses"
  ON courses FOR SELECT USING (true);

CREATE POLICY "Faculty can manage courses"
  ON courses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3e. enrollments
CREATE POLICY "Students can read own enrollments"
  ON enrollments FOR SELECT
  USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

CREATE POLICY "Faculty can manage enrollments"
  ON enrollments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3f. attendance
CREATE POLICY "Students can read own attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.enrollment_id = attendance.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
        )
    )
  );

CREATE POLICY "Faculty can manage attendance"
  ON attendance FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3g. timetable — public read, faculty write
CREATE POLICY "Anyone can read timetable"
  ON timetable FOR SELECT USING (true);

CREATE POLICY "Faculty can manage timetable"
  ON timetable FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3h. fees
CREATE POLICY "Students can read own fees"
  ON fees FOR SELECT
  USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

CREATE POLICY "Faculty can manage fees"
  ON fees FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3i. fee_payments
CREATE POLICY "Students can read own payments"
  ON fee_payments FOR SELECT
  USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

CREATE POLICY "Faculty can manage payments"
  ON fee_payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3j. hostel_rooms — public read
CREATE POLICY "Anyone can read hostel rooms"
  ON hostel_rooms FOR SELECT USING (true);

-- 3k. hostel_assignments
CREATE POLICY "Students can read own assignment"
  ON hostel_assignments FOR SELECT
  USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3l. hostel_pass_requests
CREATE POLICY "Students can read own pass requests"
  ON hostel_pass_requests FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own pass requests"
  ON hostel_pass_requests FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Faculty can read and manage all pass requests"
  ON hostel_pass_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3m. events — public read
CREATE POLICY "Anyone can read events"
  ON events FOR SELECT USING (true);

CREATE POLICY "Faculty can manage events"
  ON events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3n. event_registrations
CREATE POLICY "Students can read own registrations"
  ON event_registrations FOR SELECT
  USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

CREATE POLICY "Students can register for events"
  ON event_registrations FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can unregister from events"
  ON event_registrations FOR DELETE USING (auth.uid() = student_id);

-- 3o. circulars — public read, faculty write
CREATE POLICY "Anyone can read circulars"
  ON circulars FOR SELECT USING (true);

CREATE POLICY "Faculty can manage circulars"
  ON circulars FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );

-- 3p. performance
CREATE POLICY "Students can read own performance"
  ON performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.enrollment_id = performance.enrollment_id
        AND (
          e.student_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
        )
    )
  );

CREATE POLICY "Faculty can manage performance"
  ON performance FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
  );


-- ------------------------------------------------------------
-- 4. AUTO-PROFILE TRIGGER — creates a profiles row on signup
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ------------------------------------------------------------
-- 5. SEED DATA — demo users and campus data
-- ------------------------------------------------------------
-- STEP 1: Create the Auth users FIRST (profiles are auto-created
--         by the trigger above when auth users are inserted).
--
--   Go to: Supabase Dashboard → Authentication → Users → Add user
--
--   User 1:
--     Email        : arjun@student.campus.edu
--     Password     : student123
--     Auto-confirm : Yes
--     User metadata: { "role": "student", "full_name": "Arjun Mehta" }
--
--   User 2:
--     Email        : priya@faculty.campus.edu
--     Password     : faculty123
--     Auto-confirm : Yes
--     User metadata: { "role": "faculty", "full_name": "Dr. Priya Sharma" }
--
-- STEP 2: Run this SQL file (or re-run just section 5 below).
--         The DO block looks up the real auth user UUIDs by email.
--
-- ============================================================
-- If you haven't created the auth users yet, the block below
-- will STOP with a clear error message telling you what to do.
-- ============================================================

DO $$
DECLARE
  arjun_id  UUID;
  priya_id  UUID;
  c_cs301   UUID;
  c_cs302   UUID;
  c_cs303   UUID;
  c_cs304   UUID;
  c_cs305   UUID;
  arjun_stu UUID;
  en_cs301  UUID;
  en_cs302  UUID;
  en_cs303  UUID;
  en_cs304  UUID;
  en_cs305  UUID;
  room_b204 UUID;
  evt_hack  UUID;
  evt_cult  UUID;
  evt_faan  UUID;
  evt_cric  UUID;
  evt_aiml  UUID;
BEGIN
  -- ====== LOOKUP REAL AUTH USER IDs ======
  -- Profiles are created automatically by the trigger when auth
  -- users are inserted. We find them by email.
  SELECT id INTO arjun_id FROM profiles WHERE email = 'arjun@student.campus.edu';
  SELECT id INTO priya_id FROM profiles WHERE email = 'priya@faculty.campus.edu';

  IF arjun_id IS NULL OR priya_id IS NULL THEN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'SEED DATA SKIPPED: Auth users not found yet.';
    RAISE NOTICE '';
    RAISE NOTICE 'Create them first in the Supabase Dashboard:';
    RAISE NOTICE '  1. Go to Authentication → Users → Add user';
    RAISE NOTICE '  2. Email: arjun@student.campus.edu  Password: student123';
    RAISE NOTICE '     Metadata: {"role":"student","full_name":"Arjun Mehta"}';
    RAISE NOTICE '  3. Email: priya@faculty.campus.edu  Password: faculty123';
    RAISE NOTICE '     Metadata: {"role":"faculty","full_name":"Dr. Priya Sharma"}';
    RAISE NOTICE '';
    RAISE NOTICE 'Then re-run this SQL file.';
    RAISE NOTICE '=====================================================';
    RETURN;
  END IF;

  -- ====== STUDENTS ======
  INSERT INTO students (student_id, roll_number, department, semester, gpa, total_credits)
  VALUES (arjun_id, 'CS2024001', 'Computer Science', 4, 8.74, 142)
  ON CONFLICT (student_id) DO NOTHING;

  SELECT student_id INTO arjun_stu FROM students WHERE student_id = arjun_id;

  -- ====== FACULTY ======
  INSERT INTO faculty (faculty_id, employee_id, department, designation)
  VALUES (priya_id, 'FAC2019042', 'Computer Science', 'Associate Professor')
  ON CONFLICT (faculty_id) DO NOTHING;

  -- ====== COURSES ======
  INSERT INTO courses (course_code, course_name, department, credits) VALUES
    ('CS301', 'Data Structures',       'Computer Science', 4),
    ('CS302', 'Operating Systems',      'Computer Science', 4),
    ('CS303', 'Database Systems',       'Computer Science', 3),
    ('CS304', 'Computer Networks',      'Computer Science', 3),
    ('CS305', 'Software Engineering',   'Computer Science', 3)
  ON CONFLICT (course_code) DO NOTHING;

  SELECT course_id INTO c_cs301 FROM courses WHERE course_code = 'CS301';
  SELECT course_id INTO c_cs302 FROM courses WHERE course_code = 'CS302';
  SELECT course_id INTO c_cs303 FROM courses WHERE course_code = 'CS303';
  SELECT course_id INTO c_cs304 FROM courses WHERE course_code = 'CS304';
  SELECT course_id INTO c_cs305 FROM courses WHERE course_code = 'CS305';

  -- ====== ENROLLMENTS ======
  INSERT INTO enrollments (student_id, course_id, status) VALUES
    (arjun_stu, c_cs301, 'enrolled'),
    (arjun_stu, c_cs302, 'enrolled'),
    (arjun_stu, c_cs303, 'enrolled'),
    (arjun_stu, c_cs304, 'enrolled'),
    (arjun_stu, c_cs305, 'enrolled')
  ON CONFLICT (student_id, course_id) DO NOTHING;

  SELECT enrollment_id INTO en_cs301 FROM enrollments WHERE student_id = arjun_stu AND course_id = c_cs301;
  SELECT enrollment_id INTO en_cs302 FROM enrollments WHERE student_id = arjun_stu AND course_id = c_cs302;
  SELECT enrollment_id INTO en_cs303 FROM enrollments WHERE student_id = arjun_stu AND course_id = c_cs303;
  SELECT enrollment_id INTO en_cs304 FROM enrollments WHERE student_id = arjun_stu AND course_id = c_cs304;
  SELECT enrollment_id INTO en_cs305 FROM enrollments WHERE student_id = arjun_stu AND course_id = c_cs305;

  -- ====== ATTENDANCE (recent classes for CS301 — matches data.js: 38/42) ======
  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cs301, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5          -- weekdays only
    AND d NOT IN ('2026-05-01','2026-06-15')          -- holidays
  LIMIT 38
  ON CONFLICT (enrollment_id, class_date) DO NOTHING;

  -- Mark 4 absences for CS301 to match data.js (38 attended / 42 total)
  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (
    SELECT attendance_id FROM attendance
    WHERE enrollment_id = en_cs301 AND status = 'present'
    ORDER BY class_date DESC
    LIMIT 4
  );

  -- CS302 — 35/40
  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cs302, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
    AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 35
  ON CONFLICT (enrollment_id, class_date) DO NOTHING;

  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (
    SELECT attendance_id FROM attendance
    WHERE enrollment_id = en_cs302 AND status = 'present'
    ORDER BY class_date DESC
    LIMIT 5
  );

  -- CS303 — 30/38
  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cs303, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
    AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 30
  ON CONFLICT (enrollment_id, class_date) DO NOTHING;

  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (
    SELECT attendance_id FROM attendance
    WHERE enrollment_id = en_cs303 AND status = 'present'
    ORDER BY class_date DESC
    LIMIT 8
  );

  -- CS304 — 40/42
  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cs304, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
    AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 40
  ON CONFLICT (enrollment_id, class_date) DO NOTHING;

  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (
    SELECT attendance_id FROM attendance
    WHERE enrollment_id = en_cs304 AND status = 'present'
    ORDER BY class_date DESC
    LIMIT 2
  );

  -- CS305 — 33/38
  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cs305, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
    AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 33
  ON CONFLICT (enrollment_id, class_date) DO NOTHING;

  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (
    SELECT attendance_id FROM attendance
    WHERE enrollment_id = en_cs305 AND status = 'present'
    ORDER BY class_date DESC
    LIMIT 5
  );

  -- ====== TIMETABLE (matches data.js schedule) ======
  INSERT INTO timetable (course_id, day_of_week, period, start_time, end_time, room, slot_type) VALUES
    -- Monday
    (c_cs301, 'Monday', 1, '09:00', '09:50', 'A-301', 'lecture'),
    (c_cs303, 'Monday', 2, '10:00', '10:50', 'B-201', 'lecture'),
    (c_cs301, 'Monday', 3, '11:00', '11:50', 'C-102', 'lab'),
    (c_cs302, 'Monday', 5, '14:00', '14:50', 'A-301', 'lecture'),
    -- Tuesday
    (c_cs304, 'Tuesday', 1, '09:00', '09:50', 'D-401', 'lecture'),
    (c_cs305, 'Tuesday', 2, '10:00', '10:50', 'A-201', 'lecture'),
    (c_cs302, 'Tuesday', 4, '12:00', '12:50', 'C-103', 'lab'),
    (c_cs301, 'Tuesday', 5, '14:00', '14:50', 'A-301', 'tutorial'),
    -- Wednesday
    (c_cs303, 'Wednesday', 1, '09:00', '09:50', 'B-201', 'lecture'),
    (c_cs304, 'Wednesday', 3, '11:00', '11:50', 'D-401', 'lecture'),
    (c_cs305, 'Wednesday', 4, '12:00', '12:50', 'A-201', 'tutorial'),
    (c_cs303, 'Wednesday', 6, '15:00', '15:50', 'C-101', 'lab'),
    -- Thursday
    (c_cs302, 'Thursday', 1, '09:00', '09:50', 'A-301', 'lecture'),
    (c_cs301, 'Thursday', 2, '10:00', '10:50', 'A-301', 'lecture'),
    (c_cs305, 'Thursday', 3, '11:00', '11:50', 'A-201', 'lecture'),
    (c_cs304, 'Thursday', 5, '14:00', '14:50', 'C-104', 'lab'),
    -- Friday
    (c_cs301, 'Friday', 2, '10:00', '10:50', 'A-301', 'tutorial'),
    (c_cs302, 'Friday', 3, '11:00', '11:50', 'A-301', 'tutorial'),
    (c_cs304, 'Friday', 4, '12:00', '12:50', 'D-401', 'lecture'),
    (c_cs305, 'Friday', 5, '14:00', '14:50', 'A-201', 'lecture')
  ON CONFLICT DO NOTHING;

  -- ====== FEES ======
  INSERT INTO fees (student_id, item_name, amount, paid, due_date) VALUES
    (arjun_stu, 'Tuition Fee',  80000, true,  '2026-08-15'),
    (arjun_stu, 'Hostel Fee',   25000, true,  '2026-08-15'),
    (arjun_stu, 'Lab Fee',      10000, true,  '2026-08-15'),
    (arjun_stu, 'Library Fee',   5000, false, '2026-08-15'),
    (arjun_stu, 'Exam Fee',      5000, false, '2026-08-15');

  -- ====== FEE PAYMENTS ======
  INSERT INTO fee_payments (student_id, amount, ref_number, payment_date) VALUES
    (arjun_stu, 40000, 'PAY-2026-001', '2026-01-10'),
    (arjun_stu, 35000, 'PAY-2026-002', '2026-03-15'),
    (arjun_stu, 25000, 'PAY-2026-003', '2026-05-20');

  -- ====== HOSTEL ======
  INSERT INTO hostel_rooms (room_number, block, room_type, capacity, occupied, warden)
  VALUES ('B-204', 'Block B - Phoenix', 'Double Sharing', 2, 2, 'Dr. Ramesh Nair')
  ON CONFLICT DO NOTHING
  RETURNING room_id INTO room_b204;

  -- If room already existed, grab its ID
  IF room_b204 IS NULL THEN
    SELECT room_id INTO room_b204 FROM hostel_rooms WHERE room_number = 'B-204' AND block = 'Block B - Phoenix';
  END IF;

  INSERT INTO hostel_assignments (student_id, room_id)
  VALUES (arjun_stu, room_b204)
  ON CONFLICT (student_id) DO NOTHING;

  INSERT INTO hostel_pass_requests (student_id, pass_type, request_date, status) VALUES
    (arjun_stu, 'Night Out',  '2026-07-30', 'pending'),
    (arjun_stu, 'Home Leave', '2026-08-05', 'approved'),
    (arjun_stu, 'Late Entry', '2026-07-20', 'approved');

  -- ====== EVENTS ======
  INSERT INTO events (title, description, event_date, event_time, venue, category, total_seats, filled_seats) VALUES
    ('TechFest 2026: Hackathon',
     '36-hour hackathon with teams competing to build innovative solutions for campus problems.',
     '2026-08-10', '09:00 AM', 'Main Auditorium', 'Technical', 200, 148),
    ('Annual Cultural Fest',
     'Three days of music, dance, drama and art. Headliners include Prateek Kuhad and Divine.',
     '2026-09-15', '04:00 PM', 'Open Air Theatre', 'Cultural', 1500, 892),
    ('Industry Connect: FAANG Panel',
     'Alumni working at top tech companies share their journey and hiring insights.',
     '2026-08-02', '11:00 AM', 'Seminar Hall B', 'Workshop', 100, 76),
    ('Sports Week: Cricket Tournament',
     'Inter-department cricket tournament. Register your team of 11 players.',
     '2026-08-20', '07:00 AM', 'Sports Ground', 'Sports', 64, 48),
    ('AI/ML Workshop Series',
     'Hands-on workshop covering neural networks, transformers, and deploying models.',
     '2026-08-05', '02:00 PM', 'Lab C-101', 'Workshop', 40, 40)
  RETURNING event_id INTO evt_hack, evt_cult, evt_faan, evt_cric, evt_aiml;

  -- Register Arjun for TechFest and AI/ML (matches data.js)
  INSERT INTO event_registrations (event_id, student_id)
  SELECT evt_hack, arjun_stu
  WHERE evt_hack IS NOT NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO event_registrations (event_id, student_id)
  SELECT evt_aiml, arjun_stu
  WHERE evt_aiml IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- ====== CIRCULARS ======
  INSERT INTO circulars (title, body, priority, category, attachment, posted_by) VALUES
    ('Mid-Semester Exam Schedule Released',
     'The mid-semester examination schedule for all departments has been published. Exams begin from August 12, 2026. Students are advised to check their individual timetables on the portal.',
     'high', 'Academic', 'exam_schedule.pdf', priya_id),
    ('Hostel Mess Menu Update',
     'The mess committee has revised the weekly menu following student feedback. New menu includes more continental options on weekends and a dedicated Jain food counter.',
     'low', 'Hostel', NULL, priya_id),
    ('Campus Placement Drive - TCS',
     'TCS will be conducting a campus placement drive for final year students on August 25, 2026. Eligible students must register on the placement portal by August 15.',
     'high', 'Placement', 'tcs_job_description.pdf', priya_id),
    ('Library Extended Hours During Exams',
     'The central library will remain open until midnight from August 10 to August 25 to support exam preparation. Book borrowing limits have also been increased.',
     'medium', 'General', NULL, priya_id),
    ('Annual Sports Day Registration Open',
     'All students are encouraged to participate in the Annual Sports Day on September 5, 2026. Registration is open for individual and team events.',
     'low', 'Sports', 'sports_registration.pdf', priya_id),
    ('Anti-Ragging Committee Meeting',
     'Mandatory attendance for all first-year student representatives at the anti-ragging awareness session on August 1, 2026 at 3:00 PM in Seminar Hall A.',
     'medium', 'General', NULL, priya_id);

  -- ====== PERFORMANCE (quiz / assignment / midsem scores — matches data.js) ======
  -- CS301: quizzes [85,90,78,88], assignments [92,85,88,95,80], midsem 76
  INSERT INTO performance (enrollment_id, assessment_type, label, score, max_score) VALUES
    (en_cs301, 'quiz',       'Quiz 1',   85, 100),
    (en_cs301, 'quiz',       'Quiz 2',   90, 100),
    (en_cs301, 'quiz',       'Quiz 3',   78, 100),
    (en_cs301, 'quiz',       'Quiz 4',   88, 100),
    (en_cs301, 'assignment', 'Assignment 1', 92, 100),
    (en_cs301, 'assignment', 'Assignment 2', 85, 100),
    (en_cs301, 'assignment', 'Assignment 3', 88, 100),
    (en_cs301, 'assignment', 'Assignment 4', 95, 100),
    (en_cs301, 'assignment', 'Assignment 5', 80, 100),
    (en_cs301, 'midsem',     'Mid-Semester', 76, 100);

  -- CS302: quizzes [72,80,85,70], assignments [78,82,75,88,70], midsem 68
  INSERT INTO performance (enrollment_id, assessment_type, label, score, max_score) VALUES
    (en_cs302, 'quiz',       'Quiz 1',   72, 100),
    (en_cs302, 'quiz',       'Quiz 2',   80, 100),
    (en_cs302, 'quiz',       'Quiz 3',   85, 100),
    (en_cs302, 'quiz',       'Quiz 4',   70, 100),
    (en_cs302, 'assignment', 'Assignment 1', 78, 100),
    (en_cs302, 'assignment', 'Assignment 2', 82, 100),
    (en_cs302, 'assignment', 'Assignment 3', 75, 100),
    (en_cs302, 'assignment', 'Assignment 4', 88, 100),
    (en_cs302, 'assignment', 'Assignment 5', 70, 100),
    (en_cs302, 'midsem',     'Mid-Semester', 68, 100);

  -- CS303: quizzes [90,88,92,85], assignments [95,90,88,92,85], midsem 82
  INSERT INTO performance (enrollment_id, assessment_type, label, score, max_score) VALUES
    (en_cs303, 'quiz',       'Quiz 1',   90, 100),
    (en_cs303, 'quiz',       'Quiz 2',   88, 100),
    (en_cs303, 'quiz',       'Quiz 3',   92, 100),
    (en_cs303, 'quiz',       'Quiz 4',   85, 100),
    (en_cs303, 'assignment', 'Assignment 1', 95, 100),
    (en_cs303, 'assignment', 'Assignment 2', 90, 100),
    (en_cs303, 'assignment', 'Assignment 3', 88, 100),
    (en_cs303, 'assignment', 'Assignment 4', 92, 100),
    (en_cs303, 'assignment', 'Assignment 5', 85, 100),
    (en_cs303, 'midsem',     'Mid-Semester', 82, 100);

  -- CS304: quizzes [80,75,88,82], assignments [85,78,90,82,75], midsem 74
  INSERT INTO performance (enrollment_id, assessment_type, label, score, max_score) VALUES
    (en_cs304, 'quiz',       'Quiz 1',   80, 100),
    (en_cs304, 'quiz',       'Quiz 2',   75, 100),
    (en_cs304, 'quiz',       'Quiz 3',   88, 100),
    (en_cs304, 'quiz',       'Quiz 4',   82, 100),
    (en_cs304, 'assignment', 'Assignment 1', 85, 100),
    (en_cs304, 'assignment', 'Assignment 2', 78, 100),
    (en_cs304, 'assignment', 'Assignment 3', 90, 100),
    (en_cs304, 'assignment', 'Assignment 4', 82, 100),
    (en_cs304, 'assignment', 'Assignment 5', 75, 100),
    (en_cs304, 'midsem',     'Mid-Semester', 74, 100);

  -- CS305: quizzes [78,82,75,80], assignments [80,85,78,82,76], midsem 70
  INSERT INTO performance (enrollment_id, assessment_type, label, score, max_score) VALUES
    (en_cs305, 'quiz',       'Quiz 1',   78, 100),
    (en_cs305, 'quiz',       'Quiz 2',   82, 100),
    (en_cs305, 'quiz',       'Quiz 3',   75, 100),
    (en_cs305, 'quiz',       'Quiz 4',   80, 100),
    (en_cs305, 'assignment', 'Assignment 1', 80, 100),
    (en_cs305, 'assignment', 'Assignment 2', 85, 100),
    (en_cs305, 'assignment', 'Assignment 3', 78, 100),
    (en_cs305, 'assignment', 'Assignment 4', 82, 100),
    (en_cs305, 'assignment', 'Assignment 5', 76, 100),
    (en_cs305, 'midsem',     'Mid-Semester', 70, 100);

END $$;


-- ============================================================
-- HOW TO USE
-- ============================================================
-- STEP 1 — Create auth users (do this FIRST):
--
--   Go to: Supabase Dashboard → Authentication → Users → Add user
--
--   User 1:
--     Email        : arjun@student.campus.edu
--     Password     : student123
--     Auto-confirm : Yes
--     User metadata: { "role": "student", "full_name": "Arjun Mehta" }
--
--   User 2:
--     Email        : priya@faculty.campus.edu
--     Password     : faculty123
--     Auto-confirm : Yes
--     User metadata: { "role": "faculty", "full_name": "Dr. Priya Sharma" }
--
-- STEP 2 — Run this SQL:
--
--   1. Go to SQL Editor → New Query
--   2. Paste the ENTIRE contents of this file
--   3. Click "Run"
--
--   The trigger auto-creates profile rows for each auth user.
--   The seed block then looks up those real UUIDs and fills in
--   students, faculty, courses, attendance, fees, events, etc.
--
--   If you run the SQL BEFORE creating auth users, the seed
--   block will print a notice and skip gracefully. Just create
--   the auth users later and re-run this SQL.
-- ============================================================
