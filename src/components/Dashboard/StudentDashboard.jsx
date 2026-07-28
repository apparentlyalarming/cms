import { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Award, Clock, CalendarCheck, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#22c55e', '#f59e0b'];

export default function StudentDashboard({ user, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const [profileRes, studentRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('students').select('*').eq('student_id', user.id).single(),
        ]);

        if (cancelled) return;
        setProfile(profileRes.data);
        setStudent(studentRes.data);

        if (studentRes.data) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('enrollment_id, course:courses(course_code)')
            .eq('student_id', user.id)
            .eq('status', 'enrolled');

          if (cancelled || !enrollments) return;

          const attData = await Promise.all(
            enrollments.map(async (en, i) => {
              const { data: rows } = await supabase
                .from('attendance')
                .select('status')
                .eq('enrollment_id', en.enrollment_id);

              const total = rows?.length || 0;
              const attended = rows?.filter(r => r.status === 'present' || r.status === 'late').length || 0;
              return {
                code: en.course?.course_code || `Course ${i + 1}`,
                attended,
                total,
                color: COLORS[i % COLORS.length],
              };
            })
          );

          if (!cancelled) setAttendance(attData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;

  const name = profile?.full_name?.split(' ')[0] || 'Student';
  const totalAttended = attendance.reduce((s, a) => s + a.attended, 0);
  const totalClasses = attendance.reduce((s, a) => s + a.total, 0);
  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 1000) / 10 : 0;

  const metrics = [
    { label: 'Current GPA', value: student?.gpa ?? '—', suffix: '/10', icon: Award, color: 'from-accent to-purple-500', change: '' },
    { label: 'Attendance', value: overallPct, suffix: '%', icon: CalendarCheck, color: 'from-success to-emerald-500', change: '' },
    { label: 'Credits Earned', value: student?.total_credits ?? '—', suffix: '/180', icon: GraduationCap, color: 'from-amber-500 to-orange-500', change: '' },
    { label: 'Semester', value: student?.semester ?? '—', suffix: '', icon: Clock, color: 'from-rose-500 to-pink-500', change: student?.department || '' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Welcome back, {name} 👋</h2>
        <p className="text-surface-400 mt-1">
          {student?.department || profile?.email} • Semester {student?.semester ?? '—'} • Roll: {student?.roll_number || '—'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="card-hover animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-surface-400 text-sm">{m.label}</p>
                  <p className="metric-value mt-1 text-white">
                    {m.value}<span className="text-base font-normal text-surface-500">{m.suffix}</span>
                  </p>
                  {m.change && <p className="text-xs text-success mt-1">{m.change}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card animate-slide-up" style={{ animationDelay: '320ms' }}>
          <h3 className="section-title">Attendance Overview</h3>
          {attendance.length === 0 ? (
            <p className="text-sm text-surface-500">No enrollment data found.</p>
          ) : (
            <div className="space-y-3">
              {attendance.map((s, i) => {
                const pct = s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-surface-300 w-16 truncate">{s.code}</span>
                    <div className="flex-1 progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                    <span className="text-sm font-medium text-surface-200 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => onNavigate('attendance')} className="mt-4 text-sm text-accent-light hover:text-accent font-medium transition-colors">
            View detailed attendance →
          </button>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h3 className="section-title">Quick Links</h3>
          <div className="space-y-2">
            {[
              { label: 'Fee Status', section: 'fees' },
              { label: 'Campus Events', section: 'events' },
              { label: 'AI Performance Predictor', section: 'performance' },
              { label: 'Timetable', section: 'timetable' },
            ].map((q, i) => (
              <button key={i} onClick={() => onNavigate(q.section)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-surface-300 hover:text-white hover:bg-surface-700/40 transition-all">
                {q.label} →
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
