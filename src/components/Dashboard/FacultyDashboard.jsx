import { useState, useEffect } from 'react';
import { Users, BookOpen, ClipboardCheck, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

export default function FacultyDashboard({ user, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [facultyRec, setFacultyRec] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, coursesTeaching: 0, avgAttendance: 0, pendingEvals: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const [profileRes, facultyRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('faculty').select('*').eq('faculty_id', user.id).single(),
        ]);

        if (cancelled) return;
        setProfile(profileRes.data);
        setFacultyRec(facultyRes.data);

        const { count: studentCount } = await supabase
          .from('students').select('*', { count: 'exact', head: true });

        const { count: courseCount } = await supabase
          .from('courses').select('*', { count: 'exact', head: true })
          .eq('department', facultyRes.data?.department || 'Computer Science');

        if (!cancelled) {
          setStats({
            totalStudents: studentCount || 0,
            coursesTeaching: courseCount || 0,
            avgAttendance: 86,
            pendingEvals: 12,
          });
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

  const name = profile?.full_name?.split(' ').slice(1).join(' ') || 'Professor';
  const metrics = [
    { label: 'Students Under You', value: stats.totalStudents, icon: Users, color: 'from-accent to-purple-500' },
    { label: 'Courses Teaching', value: stats.coursesTeaching, icon: BookOpen, color: 'from-amber-500 to-orange-500' },
    { label: 'Avg Class Attendance', value: `${stats.avgAttendance}%`, icon: ClipboardCheck, color: 'from-success to-emerald-500' },
    { label: 'Pending Evaluations', value: stats.pendingEvals, icon: TrendingUp, color: 'from-rose-500 to-pink-500' },
  ];

  const alerts = [
    { text: 'Students below 75% attendance flagged', severity: 'high', icon: AlertTriangle },
    { text: 'Placement coordination meeting at 4 PM', severity: 'low', icon: Clock },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Good morning, {name} 🎓</h2>
        <p className="text-surface-400 mt-1">
          {facultyRec?.designation || 'Faculty'} • {facultyRec?.department || profile?.email} • ID: {facultyRec?.employee_id || '—'}
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
                  <p className="metric-value mt-1 text-white">{m.value}</p>
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
          <h3 className="section-title">Alerts & Reminders</h3>
          <div className="space-y-3">
            {alerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    a.severity === 'high' ? 'bg-danger/15' : 'bg-surface-700/50'
                  }`}>
                    <Icon className={`w-4 h-4 ${a.severity === 'high' ? 'text-danger' : 'text-surface-400'}`} />
                  </div>
                  <p className="text-sm text-surface-200">{a.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h3 className="section-title">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Mark Attendance', action: () => onNavigate('attendance') },
              { label: 'View Performance Analytics', action: () => onNavigate('performance') },
              { label: 'Post Circular', action: () => onNavigate('circulars') },
            ].map((q, i) => (
              <button key={i} onClick={q.action} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-surface-300 hover:text-white hover:bg-surface-700/40 transition-all">
                {q.label} →
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
