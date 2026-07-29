import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load env
const env = readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const line = env.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.split('=').slice(1).join('=').trim() : null;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getEnv('SUPABASE_SERVICE_KEY');
const GROQ_API_KEY = getEnv('GROQ_API_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GROQ_API_KEY) {
  console.error('Missing required env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: GROQ_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

async function fetchCampusData(context) {
  const { role, department, semester, userId } = context;
  const data = {};

  if (department && semester) {
    const [exams, timetable, events, circulars] = await Promise.all([
      supabase.from('exams').select('*').eq('department', department).eq('semester', semester).order('exam_date'),
      supabase.from('timetable').select('*').eq('department', department).eq('semester', semester).order('day_of_week').order('period'),
      supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date'),
      supabase.from('circulars').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    data.exams = exams.data || [];
    data.timetable = timetable.data || [];
    data.events = events.data || [];
    data.circulars = circulars.data || [];
  }

  if (role === 'student' && userId) {
    const [enrollments, attendance, fees, performance] = await Promise.all([
      supabase.from('enrollments').select('*, courses(course_name, course_code)').eq('student_id', userId),
      supabase.from('attendance').select('*, enrollments(courses(course_name, course_code))').eq('enrollments.student_id', userId),
      supabase.from('fees').select('*').eq('student_id', userId),
      supabase.from('performance').select('*, enrollments(courses(course_name))').eq('enrollments.student_id', userId),
    ]);
    data.enrollments = enrollments.data || [];
    data.attendance = attendance.data || [];
    data.fees = fees.data || [];
    data.performance = performance.data || [];
  }

  if (role === 'faculty' && userId) {
    const [facultyInfo, courses] = await Promise.all([
      supabase.from('faculty').select('*').eq('faculty_id', userId).single(),
      supabase.from('courses').select('*').eq('department', department || 'CSE'),
    ]);
    data.facultyInfo = facultyInfo.data || null;
    data.courses = courses.data || [];
  }

  return data;
}

function buildSystemPrompt(context, campusData) {
  const { role, department, semester } = context;
  const now = new Date().toISOString().split('T')[0];
  let prompt = `You are CampusAI, an assistant for a Smart Campus Management Portal. Today is ${now}.

Current user: ${role === 'student' ? 'Student' : 'Faculty'}
${department ? `Department: ${department}` : ''}
${semester ? `Semester: ${semester}` : ''}

`;

  if (campusData.exams?.length) {
    prompt += `\nUpcoming exams:\n`;
    campusData.exams.forEach(e => {
      prompt += `- ${e.subject_name}: ${e.exam_date} ${e.start_time?.slice(0,5)}-${e.end_time?.slice(0,5)} at ${e.venue} (${e.exam_type})\n`;
    });
  }

  if (campusData.timetable?.length) {
    const byDay = {};
    campusData.timetable.forEach(t => {
      if (!byDay[t.day_of_week]) byDay[t.day_of_week] = [];
      byDay[t.day_of_week].push(`Period ${t.period}: ${t.subject_name} (${t.start_time?.slice(0,5)}-${t.end_time?.slice(0,5)}) in ${t.room} [${t.slot_type}]`);
    });
    prompt += `\nClass timetable:\n`;
    for (const [day, slots] of Object.entries(byDay)) {
      prompt += `${day}: ${slots.join(', ')}\n`;
    }
  }

  if (campusData.events?.length) {
    prompt += `\nUpcoming events:\n`;
    campusData.events.forEach(e => {
      prompt += `- ${e.event_name}: ${e.event_date} at ${e.venue || 'TBD'}\n`;
    });
  }

  if (campusData.circulars?.length) {
    prompt += `\nLatest circulars:\n`;
    campusData.circulars.slice(0, 3).forEach(c => {
      prompt += `- ${c.title}: ${c.description?.slice(0, 100)}\n`;
    });
  }

  if (campusData.attendance?.length) {
    const total = campusData.attendance.length;
    const present = campusData.attendance.filter(a => a.status === 'present').length;
    const pct = total > 0 ? Math.round(present / total * 100) : 0;
    prompt += `\nAttendance: ${present}/${total} (${pct}%)\n`;
  }

  if (campusData.fees?.length) {
    prompt += `\nFees:\n`;
    campusData.fees.forEach(f => {
      prompt += `- ${f.fee_type}: ₹${f.amount} (Due: ${f.due_date || 'N/A'}, Status: ${f.status})\n`;
    });
  }

  if (campusData.performance?.length) {
    prompt += `\nPerformance:\n`;
    campusData.performance.forEach(p => {
      prompt += `- ${p.enrollments?.courses?.course_name || 'Course'}: ${p.assessment_type} - ${p.score}/${p.max_score} (${p.label || ''})\n`;
    });
  }

  prompt += `\nAnswer the user's question conversationally and helpfully using the data above. If you don't know, say so. Keep responses concise.`;
  return prompt;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const campusData = await fetchCampusData(context || {});
    const systemPrompt = buildSystemPrompt(context || {}, campusData);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    res.json({ reply: completion.choices[0]?.message?.content || 'No response' });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/predict', async (req, res) => {
  try {
    const { branch, semester, currentCgpa, attendance, attendanceTrend, quizMarks } = req.body;
    if (!branch || !semester || currentCgpa == null || attendance == null) {
      return res.status(400).json({ error: 'branch, semester, currentCgpa, attendance required' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are an academic prediction AI for a B.Tech engineering college.
Analyze student data and predict end-of-semester performance and attendance.
Grading is on a 10-point scale. Mandatory attendance is 75%.

Respond ONLY with a valid JSON object. No markdown, no code fences, no commentary.
Format exactly like this:
{
  "predicted_cgpa": 8.2,
  "predicted_final_attendance": 65,
  "attendance_risk_level": "High",
  "actionable_tips": ["Tip 1", "Tip 2"]
}`,
        },
        {
          role: 'user',
          content: `Branch: ${branch}, Semester: ${semester}
Current CGPA: ${currentCgpa}
Current Overall Attendance: ${attendance}%
Recent Weekly Attendance Trend: ${attendanceTrend || 'Not available'}
Recent Quiz Marks: ${quizMarks || 'Not available'}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleaned);
    res.json(result);
  } catch (err) {
    console.error('Predict error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`AI server running on port ${PORT}`));
