import { Users, BookOpen, ClipboardCheck, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { facultyData } from '../../data';

const metrics = [
  { label: 'Students Under You', value: facultyData.totalStudents, icon: Users, color: 'from-accent to-purple-500' },
  { label: 'Courses Teaching', value: facultyData.coursesTeaching, icon: BookOpen, color: 'from-amber-500 to-orange-500' },
  { label: 'Avg Class Attendance', value: '86%', icon: ClipboardCheck, color: 'from-success to-emerald-500' },
  { label: 'Pending Evaluations', value: 12, icon: TrendingUp, color: 'from-rose-500 to-pink-500' },
];

const todaySchedule = [
  { time: '09:00 - 09:50', subject: 'Data Structures', section: 'CS-A', room: 'A-301', type: 'Lecture' },
  { time: '10:00 - 10:50', subject: 'Data Structures', section: 'CS-B', room: 'A-301', type: 'Lecture' },
  { time: '11:00 - 11:50', subject: 'OS Tutorial', section: 'CS-A', room: 'C-103', type: 'Tutorial' },
  { time: '14:00 - 14:50', subject: 'Data Structures Lab', section: 'CS-A', room: 'C-102', type: 'Lab' },
];

const alerts = [
  { text: '3 students below 75% attendance in CS301', severity: 'high', icon: AlertTriangle },
  { text: 'CS303 assignment deadline extended to Aug 3', severity: 'medium', icon: Clock },
  { text: 'Placement coordination meeting at 4 PM', severity: 'low', icon: Clock },
];

export default function FacultyDashboard({ onNavigate }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Good morning, {facultyData.name.split(' ').slice(1).join(' ')} 🎓</h2>
        <p className="text-surface-400 mt-1">{facultyData.designation} • {facultyData.department} • ID: {facultyData.employeeId}</p>
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
          <h3 className="section-title">Today's Schedule</h3>
          <div className="space-y-3">
            {todaySchedule.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface-700/30 hover:bg-surface-700/50 transition-colors">
                <div className="w-24 flex-shrink-0">
                  <p className="text-xs text-surface-500">{s.time.split(' - ')[0]}</p>
                  <p className="text-xs text-surface-500">{s.time.split(' - ')[1]}</p>
                </div>
                <div className="w-px h-8 bg-surface-600/50" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{s.subject}</p>
                  <p className="text-xs text-surface-400">{s.section} • {s.room}</p>
                </div>
                <span className={`badge ${
                  s.type === 'Lecture' ? 'badge-accent' :
                  s.type === 'Lab' ? 'badge-warning' : 'badge-success'
                }`}>
                  {s.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h3 className="section-title">Alerts & Reminders</h3>
            <div className="space-y-3">
              {alerts.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      a.severity === 'high' ? 'bg-danger/15' : a.severity === 'medium' ? 'bg-warning/15' : 'bg-surface-700/50'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        a.severity === 'high' ? 'text-danger' : a.severity === 'medium' ? 'text-warning' : 'text-surface-400'
                      }`} />
                    </div>
                    <p className="text-sm text-surface-200">{a.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '480ms' }}>
            <h3 className="section-title">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Mark Attendance', action: () => onNavigate('attendance') },
                { label: 'View Performance Analytics', action: () => onNavigate('performance') },
                { label: 'Post Circular', action: () => onNavigate('circulars') },
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={q.action}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-surface-300 hover:text-white hover:bg-surface-700/40 transition-all"
                >
                  {q.label} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
