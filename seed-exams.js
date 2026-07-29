import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmxrnixajfyluowovsjf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_KEY env var required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const exams = [
  { department: 'Cybersecurity', semester: 3, subject_name: 'Data Structures', exam_date: '2026-08-10', start_time: '09:00', end_time: '11:00', venue: 'A-101', exam_type: 'endsem' },
  { department: 'Cybersecurity', semester: 3, subject_name: 'Database Management Systems', exam_date: '2026-08-12', start_time: '09:00', end_time: '11:00', venue: 'A-102', exam_type: 'endsem' },
  { department: 'Cybersecurity', semester: 3, subject_name: 'Computer Networks', exam_date: '2026-08-14', start_time: '14:00', end_time: '16:00', venue: 'B-201', exam_type: 'endsem' },
  { department: 'Cybersecurity', semester: 3, subject_name: 'Operating Systems', exam_date: '2026-08-16', start_time: '09:00', end_time: '11:00', venue: 'A-103', exam_type: 'midsem' },
  { department: 'Cybersecurity', semester: 3, subject_name: 'Cybersecurity Fundamentals', exam_date: '2026-08-18', start_time: '14:00', end_time: '16:00', venue: 'Lab Block-1', exam_type: 'lab_test' },
  { department: 'CSE', semester: 3, subject_name: 'Data Structures', exam_date: '2026-08-10', start_time: '09:00', end_time: '11:00', venue: 'A-201', exam_type: 'endsem' },
  { department: 'CSE', semester: 3, subject_name: 'Database Management Systems', exam_date: '2026-08-12', start_time: '09:00', end_time: '11:00', venue: 'A-202', exam_type: 'endsem' },
  { department: 'CSE', semester: 3, subject_name: 'Computer Networks', exam_date: '2026-08-14', start_time: '14:00', end_time: '16:00', venue: 'B-101', exam_type: 'endsem' },
  { department: 'CSE', semester: 3, subject_name: 'Operating Systems', exam_date: '2026-08-16', start_time: '09:00', end_time: '11:00', venue: 'A-203', exam_type: 'midsem' },
  { department: 'AIML', semester: 5, subject_name: 'Machine Learning', exam_date: '2026-08-11', start_time: '09:00', end_time: '12:00', venue: 'C-301', exam_type: 'endsem' },
  { department: 'AIML', semester: 5, subject_name: 'Deep Learning', exam_date: '2026-08-13', start_time: '09:00', end_time: '12:00', venue: 'C-302', exam_type: 'endsem' },
  { department: 'AIML', semester: 5, subject_name: 'Natural Language Processing', exam_date: '2026-08-15', start_time: '14:00', end_time: '16:00', venue: 'C-303', exam_type: 'midsem' },
  { department: 'AIML', semester: 5, subject_name: 'Computer Vision Lab', exam_date: '2026-08-17', start_time: '09:00', end_time: '11:00', venue: 'AI Lab-1', exam_type: 'lab_test' },
  { department: 'Electronics and Communication', semester: 5, subject_name: 'Digital Signal Processing', exam_date: '2026-08-11', start_time: '09:00', end_time: '11:00', venue: 'D-101', exam_type: 'endsem' },
  { department: 'Electronics and Communication', semester: 5, subject_name: 'Embedded Systems', exam_date: '2026-08-13', start_time: '14:00', end_time: '16:00', venue: 'D-102', exam_type: 'endsem' },
  { department: 'Electronics and Communication', semester: 5, subject_name: 'VLSI Design', exam_date: '2026-08-15', start_time: '09:00', end_time: '11:00', venue: 'D-103', exam_type: 'midsem' },
  { department: 'Mech', semester: 5, subject_name: 'Thermodynamics', exam_date: '2026-08-11', start_time: '09:00', end_time: '11:00', venue: 'E-101', exam_type: 'endsem' },
  { department: 'Mech', semester: 5, subject_name: 'Fluid Mechanics', exam_date: '2026-08-13', start_time: '09:00', end_time: '11:00', venue: 'E-102', exam_type: 'endsem' },
  { department: 'Mech', semester: 5, subject_name: 'CAD Lab', exam_date: '2026-08-15', start_time: '14:00', end_time: '16:00', venue: 'Mech Lab-1', exam_type: 'lab_test' },
  { department: 'Cybersecurity', semester: 3, subject_name: 'Data Structures', exam_date: '2026-07-28', start_time: '09:00', end_time: '11:00', venue: 'A-101', exam_type: 'quiz' },
];

async function seed() {
  console.log('Seeding exam data...');

  const { data, error } = await supabase.from('exams').insert(exams).select();
  if (error) {
    console.error('Error seeding exams:', error.message);
    process.exit(1);
  }
  console.log(`Inserted ${data.length} exams`);
  process.exit(0);
}

seed();
