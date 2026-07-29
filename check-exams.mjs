import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const lines = env.split('\n').filter(l => l.startsWith('SUPABASE_SERVICE_KEY'));
const key = lines[0].split('=').slice(1).join('=');

const supabase = createClient('https://vmxrnixajfyluowovsjf.supabase.co', key);

const { data, error } = await supabase.from('exams').select('*').order('exam_date').order('start_time');
if (error) { console.log('Error:', error.message); process.exit(1); }
console.log(`Count: ${data.length}`);
data.forEach(e => console.log(`${e.exam_date} ${e.start_time?.slice(0,5)} | ${e.subject_name.padEnd(30)} | ${e.venue.padEnd(12)} | ${e.department} Sem${e.semester} | ${e.exam_type}`));
