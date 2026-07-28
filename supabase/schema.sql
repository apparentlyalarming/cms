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
-- 1. DOMAINS / ENUMS
-- ------------------------------------------------------------

-- Restrict department to the 5 B.Tech branches
CREATE DOMAIN department_type AS TEXT
  CHECK (VALUE IN ('CSE', 'Cybersecurity', 'AIML', 'Electronics and Communication', 'Mech'));

-- ------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------

-- 2a. profiles — one row per auth user, created by the trigger below
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2b. students — extended info for users with role = 'student'
CREATE TABLE IF NOT EXISTS students (
  student_id   UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  roll_number  TEXT UNIQUE NOT NULL,
  department   department_type NOT NULL DEFAULT 'CSE',
  semester     INT NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 8),
  gpa          NUMERIC(3,2) DEFAULT 0.00,
  total_credits INT DEFAULT 0
);

-- 2c. faculty — extended info for users with role = 'faculty'
CREATE TABLE IF NOT EXISTS faculty (
  faculty_id  UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  department  department_type NOT NULL DEFAULT 'CSE',
  designation TEXT NOT NULL DEFAULT 'Assistant Professor'
);

-- 2d. courses
CREATE TABLE IF NOT EXISTS courses (
  course_id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  department  department_type NOT NULL DEFAULT 'CSE',
  credits     INT NOT NULL DEFAULT 3 CHECK (credits > 0)
);

-- 2e. enrollments — which student is taking which course

-- 2f. attendance — per-subject, per-date records
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  class_date    DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (enrollment_id, class_date)
);

-- 2g. timetable — weekly class slots with department & semester scoping
CREATE TABLE IF NOT EXISTS timetable (
  slot_id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department   department_type NOT NULL DEFAULT 'CSE',
  semester     INT NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 8),
  day_of_week  TEXT NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  period       INT NOT NULL CHECK (period BETWEEN 1 AND 8),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  subject_name TEXT NOT NULL DEFAULT 'Lecture',
  faculty_id   UUID REFERENCES faculty(faculty_id) ON DELETE SET NULL,
  room         TEXT,
  slot_type    TEXT NOT NULL DEFAULT 'lecture' CHECK (slot_type IN ('lecture','lab','tutorial'))
);

-- 2h. fees

-- 2i. fee_payments — payment history ledger

-- 2j. hostel_rooms

-- 2k. hostel_assignments

-- 2l. hostel_pass_requests

-- 2m. events

-- 2n. event_registrations

-- 2o. circulars — official notices / notice board

-- 2p. performance — quiz / assignment / exam scores per enrollment
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
-- 3. HELPER FUNCTION (bypasses RLS via SECURITY DEFINER)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid(); $$;

-- ------------------------------------------------------------
-- 4. RLS POLICIES
-- ------------------------------------------------------------

-- 4a. profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Faculty can read all profiles"
  ON profiles FOR SELECT
  USING (public.current_user_role() = 'faculty');

-- 4b. students
CREATE POLICY "Students can read own record"
  ON students FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Faculty can read all students"
  ON students FOR SELECT
  USING (public.current_user_role() = 'faculty');

CREATE POLICY "Students can update own record"
  ON students FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own record"
  ON students FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 4c. faculty
CREATE POLICY "Faculty can read own record"
  ON faculty FOR SELECT USING (auth.uid() = faculty_id);

CREATE POLICY "Students can read faculty list"
  ON faculty FOR SELECT USING (true);

CREATE POLICY "Faculty can insert own record"
  ON faculty FOR INSERT WITH CHECK (auth.uid() = faculty_id);

-- 4d. courses — readable by everyone, write by faculty
CREATE POLICY "Anyone can read courses"
  ON courses FOR SELECT USING (true);

CREATE POLICY "Faculty can manage courses"
  ON courses FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4e. enrollments
CREATE POLICY "Students can read own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = student_id OR public.current_user_role() = 'faculty');

CREATE POLICY "Faculty can manage enrollments"
  ON enrollments FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4f. attendance
CREATE POLICY "Students can read own attendance"
  ON attendance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.enrollment_id = attendance.enrollment_id
      AND (e.student_id = auth.uid() OR public.current_user_role() = 'faculty')
  ));

CREATE POLICY "Faculty can manage attendance"
  ON attendance FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4g. timetable — public read, faculty write
CREATE POLICY "Anyone can read timetable"
  ON timetable FOR SELECT USING (true);

CREATE POLICY "Faculty can manage timetable"
  ON timetable FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4h. fees
CREATE POLICY "Students can read own fees"
  ON fees FOR SELECT
  USING (auth.uid() = student_id OR public.current_user_role() = 'faculty');

CREATE POLICY "Faculty can manage fees"
  ON fees FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4i. fee_payments
CREATE POLICY "Students can read own payments"
  ON fee_payments FOR SELECT
  USING (auth.uid() = student_id OR public.current_user_role() = 'faculty');

CREATE POLICY "Faculty can manage payments"
  ON fee_payments FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4j. hostel_rooms — public read
CREATE POLICY "Anyone can read hostel rooms"
  ON hostel_rooms FOR SELECT USING (true);

-- 4k. hostel_assignments
CREATE POLICY "Students can read own assignment"
  ON hostel_assignments FOR SELECT
  USING (auth.uid() = student_id OR public.current_user_role() = 'faculty');

-- 4l. hostel_pass_requests
CREATE POLICY "Students can read own pass requests"
  ON hostel_pass_requests FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own pass requests"
  ON hostel_pass_requests FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Faculty can read and manage all pass requests"
  ON hostel_pass_requests FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4m. events — public read
CREATE POLICY "Anyone can read events"
  ON events FOR SELECT USING (true);

CREATE POLICY "Faculty can manage events"
  ON events FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4n. event_registrations
CREATE POLICY "Students can read own registrations"
  ON event_registrations FOR SELECT
  USING (auth.uid() = student_id OR public.current_user_role() = 'faculty');

CREATE POLICY "Students can register for events"
  ON event_registrations FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can unregister from events"
  ON event_registrations FOR DELETE USING (auth.uid() = student_id);

-- 4o. circulars — public read, faculty write
CREATE POLICY "Anyone can read circulars"
  ON circulars FOR SELECT USING (true);

CREATE POLICY "Faculty can manage circulars"
  ON circulars FOR ALL
  USING (public.current_user_role() = 'faculty');

-- 4p. performance
CREATE POLICY "Students can read own performance"
  ON performance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.enrollment_id = performance.enrollment_id
      AND (e.student_id = auth.uid() OR public.current_user_role() = 'faculty')
  ));

CREATE POLICY "Faculty can manage performance"
  ON performance FOR ALL
  USING (public.current_user_role() = 'faculty');


-- ------------------------------------------------------------
-- 5. AUTO-PROFILE TRIGGER — creates a profiles row on signup
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
-- 6. SEED DATA — demo users and campus data
-- ------------------------------------------------------------
-- STEP 1: Create the Auth users FIRST (profiles are auto-created
--         by the trigger above when auth users are inserted).
--
--   Go to: Supabase Dashboard → Authentication → Users → Add user
--
--   User 1 (Student):
--     Email        : albinsunny@gmail.com
--     Password     : @student123
--     Auto-confirm : Yes
--     User metadata: { "role": "student", "full_name": "Albin Sunny" }
--
--   User 2 (Faculty):
--     Email        : apparentlyalarming@gmail.com
--     Password     : @faculty123
--     Auto-confirm : Yes
--     User metadata: { "role": "faculty", "full_name": "Rina" }
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
  albin_id  UUID;
  rina_id   UUID;
  c_cc301   UUID;
  c_cc302   UUID;
  c_cc303   UUID;
  c_cc304   UUID;
  c_cc305   UUID;
  albin_stu UUID;
  en_cc301  UUID;
  en_cc302  UUID;
  en_cc303  UUID;
  en_cc304  UUID;
  en_cc305  UUID;
  room_b204 UUID;
  evt_hack  UUID;
  evt_cult  UUID;
  evt_faan  UUID;
  evt_cric  UUID;
  evt_aiml  UUID;
BEGIN
  -- ====== LOOKUP REAL AUTH USER IDs ======
  SELECT id INTO albin_id FROM profiles WHERE email = 'albinsunny@gmail.com';
  SELECT id INTO rina_id FROM profiles WHERE email = 'apparentlyalarming@gmail.com';

  IF albin_id IS NULL OR rina_id IS NULL THEN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'SEED DATA SKIPPED: Auth users not found yet.';
    RAISE NOTICE '';
    RAISE NOTICE 'Create them first in the Supabase Dashboard:';
    RAISE NOTICE '  1. Email: albinsunny@gmail.com  Password: @student123';
    RAISE NOTICE '     Metadata: {"role":"student","full_name":"Albin Sunny"}';
    RAISE NOTICE '  2. Email: apparentlyalarming@gmail.com  Password: @faculty123';
    RAISE NOTICE '     Metadata: {"role":"faculty","full_name":"Rina"}';
    RAISE NOTICE '';
    RAISE NOTICE 'Then re-run this SQL file.';
    RAISE NOTICE '=====================================================';
    RETURN;
  END IF;

  -- ====== STUDENTS ======
  INSERT INTO students (student_id, roll_number, department, semester, gpa, total_credits)
  VALUES (albin_id, 'HKC24CC003', 'Cybersecurity', 4, 8.50, 120)
  ON CONFLICT (student_id) DO NOTHING;

  SELECT student_id INTO albin_stu FROM students WHERE student_id = albin_id;

  -- ====== FACULTY ======
  INSERT INTO faculty (faculty_id, employee_id, department, designation)
  VALUES (rina_id, 'HKC24CCF01', 'Cybersecurity', 'Assistant Professor')
  ON CONFLICT (faculty_id) DO NOTHING;

  -- ====== COURSES (Cybersecurity dept) ======
  INSERT INTO courses (course_code, course_name, department, credits) VALUES
    ('CC301', 'Network Security',          'Cybersecurity', 4),
    ('CC302', 'Cryptography',              'Cybersecurity', 4),
    ('CC303', 'Ethical Hacking',           'Cybersecurity', 3),
    ('CC304', 'Digital Forensics',         'Cybersecurity', 3),
    ('CC305', 'Cyber Law & Ethics',        'Cybersecurity', 3)
  ON CONFLICT (course_code) DO NOTHING;

  SELECT course_id INTO c_cc301 FROM courses WHERE course_code = 'CC301';
  SELECT course_id INTO c_cc302 FROM courses WHERE course_code = 'CC302';
  SELECT course_id INTO c_cc303 FROM courses WHERE course_code = 'CC303';
  SELECT course_id INTO c_cc304 FROM courses WHERE course_code = 'CC304';
  SELECT course_id INTO c_cc305 FROM courses WHERE course_code = 'CC305';

  -- ====== ENROLLMENTS ======
  INSERT INTO enrollments (student_id, course_id, status) VALUES
    (albin_stu, c_cc301, 'enrolled'),
    (albin_stu, c_cc302, 'enrolled'),
    (albin_stu, c_cc303, 'enrolled'),
    (albin_stu, c_cc304, 'enrolled'),
    (albin_stu, c_cc305, 'enrolled')
  ON CONFLICT (student_id, course_id) DO NOTHING;

  SELECT enrollment_id INTO en_cc301 FROM enrollments WHERE student_id = albin_stu AND course_id = c_cc301;
  SELECT enrollment_id INTO en_cc302 FROM enrollments WHERE student_id = albin_stu AND course_id = c_cc302;
  SELECT enrollment_id INTO en_cc303 FROM enrollments WHERE student_id = albin_stu AND course_id = c_cc303;
  SELECT enrollment_id INTO en_cc304 FROM enrollments WHERE student_id = albin_stu AND course_id = c_cc304;
  SELECT enrollment_id INTO en_cc305 FROM enrollments WHERE student_id = albin_stu AND course_id = c_cc305;

  -- ====== ATTENDANCE ======
  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cc301, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 38 ON CONFLICT (enrollment_id, class_date) DO NOTHING;
  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (SELECT attendance_id FROM attendance WHERE enrollment_id = en_cc301 AND status = 'present' ORDER BY class_date DESC LIMIT 4);

  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cc302, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 35 ON CONFLICT (enrollment_id, class_date) DO NOTHING;
  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (SELECT attendance_id FROM attendance WHERE enrollment_id = en_cc302 AND status = 'present' ORDER BY class_date DESC LIMIT 5);

  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cc303, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 30 ON CONFLICT (enrollment_id, class_date) DO NOTHING;
  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (SELECT attendance_id FROM attendance WHERE enrollment_id = en_cc303 AND status = 'present' ORDER BY class_date DESC LIMIT 8);

  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cc304, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 40 ON CONFLICT (enrollment_id, class_date) DO NOTHING;
  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (SELECT attendance_id FROM attendance WHERE enrollment_id = en_cc304 AND status = 'present' ORDER BY class_date DESC LIMIT 2);

  INSERT INTO attendance (enrollment_id, class_date, status)
  SELECT en_cc305, d, 'present'
  FROM generate_series('2026-04-01'::date, '2026-07-28'::date, '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d NOT IN ('2026-05-01','2026-06-15')
  LIMIT 33 ON CONFLICT (enrollment_id, class_date) DO NOTHING;
  UPDATE attendance SET status = 'absent'
  WHERE attendance_id IN (SELECT attendance_id FROM attendance WHERE enrollment_id = en_cc305 AND status = 'present' ORDER BY class_date DESC LIMIT 5);

  -- ====== TIMETABLE — Cybersecurity Sem 4 ======
  INSERT INTO timetable (department, semester, day_of_week, period, start_time, end_time, subject_name, faculty_id, room, slot_type) VALUES
    ('Cybersecurity', 4, 'Monday', 1, '09:00', '09:50', 'Network Security', rina_id, 'A-301', 'lecture'),
    ('Cybersecurity', 4, 'Monday', 2, '10:00', '10:50', 'Cryptography', rina_id, 'B-201', 'lecture'),
    ('Cybersecurity', 4, 'Monday', 3, '11:00', '11:50', 'Network Security Lab', rina_id, 'C-102', 'lab'),
    ('Cybersecurity', 4, 'Monday', 5, '14:00', '14:50', 'Ethical Hacking', rina_id, 'A-301', 'lecture'),
    ('Cybersecurity', 4, 'Tuesday', 1, '09:00', '09:50', 'Digital Forensics', rina_id, 'D-401', 'lecture'),
    ('Cybersecurity', 4, 'Tuesday', 2, '10:00', '10:50', 'Cyber Law & Ethics', rina_id, 'A-201', 'lecture'),
    ('Cybersecurity', 4, 'Tuesday', 4, '12:00', '12:50', 'Ethical Hacking Lab', rina_id, 'C-103', 'lab'),
    ('Cybersecurity', 4, 'Tuesday', 5, '14:00', '14:50', 'Network Security Tut', rina_id, 'A-301', 'tutorial'),
    ('Cybersecurity', 4, 'Wednesday', 1, '09:00', '09:50', 'Cryptography', rina_id, 'B-201', 'lecture'),
    ('Cybersecurity', 4, 'Wednesday', 3, '11:00', '11:50', 'Digital Forensics', rina_id, 'D-401', 'lecture'),
    ('Cybersecurity', 4, 'Wednesday', 4, '12:00', '12:50', 'Cyber Law Tut', rina_id, 'A-201', 'tutorial'),
    ('Cybersecurity', 4, 'Wednesday', 6, '15:00', '15:50', 'Digital Forensics Lab', rina_id, 'C-101', 'lab'),
    ('Cybersecurity', 4, 'Thursday', 1, '09:00', '09:50', 'Ethical Hacking', rina_id, 'A-301', 'lecture'),
    ('Cybersecurity', 4, 'Thursday', 2, '10:00', '10:50', 'Network Security', rina_id, 'A-301', 'lecture'),
    ('Cybersecurity', 4, 'Thursday', 3, '11:00', '11:50', 'Cyber Law & Ethics', rina_id, 'A-201', 'lecture'),
    ('Cybersecurity', 4, 'Thursday', 5, '14:00', '14:50', 'Cryptography Lab', rina_id, 'C-104', 'lab'),
    ('Cybersecurity', 4, 'Friday', 2, '10:00', '10:50', 'Network Security Tut', rina_id, 'A-301', 'tutorial'),
    ('Cybersecurity', 4, 'Friday', 3, '11:00', '11:50', 'Ethical Hacking Tut', rina_id, 'A-301', 'tutorial'),
    ('Cybersecurity', 4, 'Friday', 4, '12:00', '12:50', 'Digital Forensics', rina_id, 'D-401', 'lecture'),
    ('Cybersecurity', 4, 'Friday', 5, '14:00', '14:50', 'Cyber Law & Ethics', rina_id, 'A-201', 'lecture')
  ON CONFLICT DO NOTHING;

  -- ====== FEES ======
  INSERT INTO fees (student_id, item_name, amount, paid, due_date) VALUES
    (albin_stu, 'Tuition Fee',  80000, true,  '2026-08-15'),
    (albin_stu, 'Hostel Fee',   25000, true,  '2026-08-15'),
    (albin_stu, 'Lab Fee',      10000, true,  '2026-08-15'),
    (albin_stu, 'Library Fee',   5000, false, '2026-08-15'),
    (albin_stu, 'Exam Fee',      5000, false, '2026-08-15');

  INSERT INTO fee_payments (student_id, amount, ref_number, payment_date) VALUES
    (albin_stu, 40000, 'PAY-2026-001', '2026-01-10'),
    (albin_stu, 35000, 'PAY-2026-002', '2026-03-15'),
    (albin_stu, 25000, 'PAY-2026-003', '2026-05-20');

  -- ====== HOSTEL ======
  INSERT INTO hostel_rooms (room_number, block, room_type, capacity, occupied, warden)
  VALUES ('B-204', 'Block B - Phoenix', 'Double Sharing', 2, 2, 'Dr. Ramesh Nair')
  ON CONFLICT DO NOTHING
  RETURNING room_id INTO room_b204;
  IF room_b204 IS NULL THEN
    SELECT room_id INTO room_b204 FROM hostel_rooms WHERE room_number = 'B-204' AND block = 'Block B - Phoenix';
  END IF;

  INSERT INTO hostel_assignments (student_id, room_id)
  VALUES (albin_stu, room_b204)
  ON CONFLICT (student_id) DO NOTHING;

  INSERT INTO hostel_pass_requests (student_id, pass_type, request_date, status) VALUES
    (albin_stu, 'Night Out',  '2026-07-30', 'pending'),
    (albin_stu, 'Home Leave', '2026-08-05', 'approved'),
    (albin_stu, 'Late Entry', '2026-07-20', 'approved');

  -- ====== EVENTS ======
  INSERT INTO events (title, description, event_date, event_time, venue, category, total_seats, filled_seats) VALUES
    ('TechFest 2026: Hackathon', '36-hour hackathon with teams competing to build innovative solutions for campus problems.', '2026-08-10', '09:00 AM', 'Main Auditorium', 'Technical', 200, 148),
    ('Annual Cultural Fest', 'Three days of music, dance, drama and art.', '2026-09-15', '04:00 PM', 'Open Air Theatre', 'Cultural', 1500, 892),
    ('Industry Connect: FAANG Panel', 'Alumni working at top tech companies share their journey.', '2026-08-02', '11:00 AM', 'Seminar Hall B', 'Workshop', 100, 76),
    ('Sports Week: Cricket Tournament', 'Inter-department cricket tournament.', '2026-08-20', '07:00 AM', 'Sports Ground', 'Sports', 64, 48),
    ('AI/ML Workshop Series', 'Hands-on workshop covering neural networks and deploying models.', '2026-08-05', '02:00 PM', 'Lab C-101', 'Workshop', 40, 40)
  RETURNING event_id INTO evt_hack, evt_cult, evt_faan, evt_cric, evt_aiml;

  INSERT INTO event_registrations (event_id, student_id) SELECT evt_hack, albin_stu WHERE evt_hack IS NOT NULL ON CONFLICT DO NOTHING;
  INSERT INTO event_registrations (event_id, student_id) SELECT evt_aiml, albin_stu WHERE evt_aiml IS NOT NULL ON CONFLICT DO NOTHING;

  -- ====== CIRCULARS ======
  INSERT INTO circulars (title, body, priority, category, attachment, posted_by) VALUES
    ('Mid-Semester Exam Schedule Released', 'The mid-semester examination schedule for all departments has been published.', 'high', 'Academic', 'exam_schedule.pdf', rina_id),
    ('Hostel Mess Menu Update', 'The mess committee has revised the weekly menu.', 'low', 'Hostel', NULL, rina_id),
    ('Campus Placement Drive - TCS', 'TCS campus drive for final year students on August 25.', 'high', 'Placement', 'tcs_job_description.pdf', rina_id),
    ('Library Extended Hours During Exams', 'Library open until midnight from August 10 to August 25.', 'medium', 'General', NULL, rina_id),
    ('Annual Sports Day Registration Open', 'Register for Sports Day on September 5.', 'low', 'Sports', 'sports_registration.pdf', rina_id),
    ('Anti-Ragging Committee Meeting', 'Mandatory attendance for all first-year representatives.', 'medium', 'General', NULL, rina_id);

  -- ====== PERFORMANCE ======
  INSERT INTO performance (enrollment_id, assessment_type, label, score, max_score) VALUES
    (en_cc301, 'quiz', 'Quiz 1', 85, 100), (en_cc301, 'quiz', 'Quiz 2', 90, 100),
    (en_cc301, 'quiz', 'Quiz 3', 78, 100), (en_cc301, 'quiz', 'Quiz 4', 88, 100),
    (en_cc301, 'assignment', 'Assignment 1', 92, 100), (en_cc301, 'assignment', 'Assignment 2', 85, 100),
    (en_cc301, 'assignment', 'Assignment 3', 88, 100), (en_cc301, 'assignment', 'Assignment 4', 95, 100),
    (en_cc301, 'assignment', 'Assignment 5', 80, 100), (en_cc301, 'midsem', 'Mid-Semester', 76, 100),
    (en_cc302, 'quiz', 'Quiz 1', 72, 100), (en_cc302, 'quiz', 'Quiz 2', 80, 100),
    (en_cc302, 'quiz', 'Quiz 3', 85, 100), (en_cc302, 'quiz', 'Quiz 4', 70, 100),
    (en_cc302, 'assignment', 'Assignment 1', 78, 100), (en_cc302, 'assignment', 'Assignment 2', 82, 100),
    (en_cc302, 'assignment', 'Assignment 3', 75, 100), (en_cc302, 'assignment', 'Assignment 4', 88, 100),
    (en_cc302, 'assignment', 'Assignment 5', 70, 100), (en_cc302, 'midsem', 'Mid-Semester', 68, 100),
    (en_cc303, 'quiz', 'Quiz 1', 90, 100), (en_cc303, 'quiz', 'Quiz 2', 88, 100),
    (en_cc303, 'quiz', 'Quiz 3', 92, 100), (en_cc303, 'quiz', 'Quiz 4', 85, 100),
    (en_cc303, 'assignment', 'Assignment 1', 95, 100), (en_cc303, 'assignment', 'Assignment 2', 90, 100),
    (en_cc303, 'assignment', 'Assignment 3', 88, 100), (en_cc303, 'assignment', 'Assignment 4', 92, 100),
    (en_cc303, 'assignment', 'Assignment 5', 85, 100), (en_cc303, 'midsem', 'Mid-Semester', 82, 100),
    (en_cc304, 'quiz', 'Quiz 1', 80, 100), (en_cc304, 'quiz', 'Quiz 2', 75, 100),
    (en_cc304, 'quiz', 'Quiz 3', 88, 100), (en_cc304, 'quiz', 'Quiz 4', 82, 100),
    (en_cc304, 'assignment', 'Assignment 1', 85, 100), (en_cc304, 'assignment', 'Assignment 2', 78, 100),
    (en_cc304, 'assignment', 'Assignment 3', 90, 100), (en_cc304, 'assignment', 'Assignment 4', 82, 100),
    (en_cc304, 'assignment', 'Assignment 5', 75, 100), (en_cc304, 'midsem', 'Mid-Semester', 74, 100),
    (en_cc305, 'quiz', 'Quiz 1', 78, 100), (en_cc305, 'quiz', 'Quiz 2', 82, 100),
    (en_cc305, 'quiz', 'Quiz 3', 75, 100), (en_cc305, 'quiz', 'Quiz 4', 80, 100),
    (en_cc305, 'assignment', 'Assignment 1', 80, 100), (en_cc305, 'assignment', 'Assignment 2', 85, 100),
    (en_cc305, 'assignment', 'Assignment 3', 78, 100), (en_cc305, 'assignment', 'Assignment 4', 82, 100),
    (en_cc305, 'assignment', 'Assignment 5', 76, 100), (en_cc305, 'midsem', 'Mid-Semester', 70, 100);

END $$;


-- ============================================================
-- HOW TO USE
-- ============================================================
-- STEP 1 — Create auth users (do this FIRST):
--
--   Go to: Supabase Dashboard → Authentication → Users → Add user
--
--   User 1 (Student):
--     Email        : albinsunny@gmail.com
--     Password     : @student123
--     Auto-confirm : Yes
--     User metadata: { "role": "student", "full_name": "Albin Sunny" }
--
--   User 2 (Faculty):
--     Email        : apparentlyalarming@gmail.com
--     Password     : @faculty123
--     Auto-confirm : Yes
--     User metadata: { "role": "faculty", "full_name": "Rina" }
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
