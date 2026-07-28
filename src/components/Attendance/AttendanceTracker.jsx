import { useState, useEffect } from 'react';
import { AlertTriangle, Calculator } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#22c55e', '#f59e0b'];

export default function AttendanceTracker({ user }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPredictor, setShowPredictor] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('enrollment_id, course:courses(course_code, course_name)')
          .eq('student_id', user.id)
          .eq('status', 'enrolled');

        if (cancelled || !enrollments) return;

        const results = await Promise.all(
          enrollments.map(async (en, i) => {
            const { data: rows } = await supabase
              .from('attendance')
              .select('status')
              .eq('enrollment_id', en.enrollment_id);

            const total = rows?.length || 0;
            const attended = rows?.filter(r => r.status === 'present' || r.status === 'late').length || 0;
            return {
              name: en.course?.course_name || 'Unknown',
              code: en.course?.course_code || '—',
              attended,
              total,
              color: COLORS[i % COLORS.length],
            };
          })
        );

        if (!cancelled) setSubjects(results);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <LoadingState message="Loading attendance..." />;
  if (error) return <ErrorState message={error} />;

  const totalAttended = subjects.reduce((s, a) => s + a.attended, 0);
  const totalClasses = subjects.reduce((s, a) => s + a.total, 0);
  const overallPct = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Attendance Tracker</h2>
          <p className="text-surface-400 mt-1">Track your attendance across all subjects</p>
        </div>
        <button onClick={() => setShowPredictor(!showPredictor)} className="btn-primary flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          AI Predictor
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center animate-slide-up">
          <p className="text-surface-400 text-sm">Overall Attendance</p>
          <p className="metric-value text-white mt-1">{overallPct}%</p>
          <div className="mt-3 progress-bar">
            <div className="progress-fill bg-gradient-to-r from-success to-emerald-400" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
        <div className="card text-center animate-slide-up" style={{ animationDelay: '80ms' }}>
          <p className="text-surface-400 text-sm">Classes Attended</p>
          <p className="metric-value text-success mt-1">{totalAttended}</p>
          <p className="text-xs text-surface-500 mt-2">out of {totalClasses} total</p>
        </div>
        <div className="card text-center animate-slide-up" style={{ animationDelay: '160ms' }}>
          <p className="text-surface-400 text-sm">Classes Missed</p>
          <p className="metric-value text-danger mt-1">{totalClasses - totalAttended}</p>
        </div>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '240ms' }}>
        <h3 className="section-title">Subject-wise Breakdown</h3>
        {subjects.length === 0 ? (
          <p className="text-sm text-surface-500">No enrollment data found.</p>
        ) : (
          <div className="space-y-4">
            {subjects.map((s, i) => {
              const pct = s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0;
              const status = pct >= 85 ? 'good' : pct >= 75 ? 'warning' : 'danger';
              return (
                <div key={i} className="p-4 rounded-xl bg-surface-700/30 hover:bg-surface-700/50 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <div>
                        <h4 className="text-sm font-medium text-white">{s.name}</h4>
                        <p className="text-xs text-surface-500">{s.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${status === 'good' ? 'badge-success' : status === 'warning' ? 'badge-warning' : 'badge-danger'}`}>
                        {pct}%
                      </span>
                      {status === 'danger' && <AlertTriangle className="w-4 h-4 text-danger" />}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-surface-500">
                    <span>{s.attended} attended</span>
                    <span>{s.total - s.attended} missed</span>
                    <span>{s.total} total</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPredictor && <AttendancePredictor subjects={subjects} totalAttended={totalAttended} totalClasses={totalClasses} onClose={() => setShowPredictor(false)} />}
    </div>
  );
}

function AttendancePredictor({ subjects, totalAttended, totalClasses, onClose }) {
  const [attended, setAttended] = useState(0);
  const [missed, setMissed] = useState(0);

  const newTotal = totalClasses + attended + missed;
  const newAttended = totalAttended + attended;
  const predictedPct = newTotal > 0 ? ((newAttended / newTotal) * 100).toFixed(1) : '0.0';
  const status = predictedPct >= 75 ? 'good' : predictedPct >= 65 ? 'warning' : 'danger';

  return (
    <div className="card glow-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-accent-light" />
          <h3 className="font-semibold text-white">Attendance Predictor</h3>
          <span className="badge-accent">AI</span>
        </div>
        <button onClick={onClose} className="text-surface-500 hover:text-white transition-colors text-sm">✕</button>
      </div>
      <p className="text-sm text-surface-400 mb-4">Enter your expected future classes to see your predicted attendance.</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-surface-400 mb-1.5">Expected Attended</label>
          <input type="number" min="0" value={attended} onChange={(e) => setAttended(parseInt(e.target.value) || 0)} className="input-field" placeholder="0" />
        </div>
        <div>
          <label className="block text-sm text-surface-400 mb-1.5">Expected Missed</label>
          <input type="number" min="0" value={missed} onChange={(e) => setMissed(parseInt(e.target.value) || 0)} className="input-field" placeholder="0" />
        </div>
      </div>
      <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-700/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-surface-400">Predicted Attendance</span>
          <span className={`text-2xl font-bold ${status === 'good' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-danger'}`}>
            {predictedPct}%
          </span>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${status === 'good' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${Math.min(predictedPct, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
