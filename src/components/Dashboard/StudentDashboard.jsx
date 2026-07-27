import { TrendingUp, Users, BookOpen, Award, Clock, CalendarCheck, GraduationCap, BarChart3 } from 'lucide-react';
import { studentData, attendanceData } from '../../data';

const metrics = [
  { label: 'Current GPA', value: studentData.gpa, suffix: '/10', icon: Award, color: 'from-accent to-purple-500', change: '+0.12' },
  { label: 'Attendance', value: attendanceData.overallPercentage, suffix: '%', icon: CalendarCheck, color: 'from-success to-emerald-500', change: '+2.1%' },
  { label: 'Credits Earned', value: studentData.totalCredits, suffix: '/180', icon: GraduationCap, color: 'from-amber-500 to-orange-500', change: '+14' },
  { label: 'Upcoming Deadlines', value: 3, suffix: '', icon: Clock, color: 'from-rose-500 to-pink-500', change: 'This week' },
];

const recentActivity = [
  { icon: BookOpen, text: 'CS303 assignment submitted', time: '2 hours ago', color: 'text-accent-light' },
  { icon: Award, text: 'Quiz 4 graded: 88/100 in CS301', time: '5 hours ago', color: 'text-success' },
  { icon: CalendarCheck, text: 'Attendance marked for CS302', time: 'Yesterday', color: 'text-amber-400' },
  { icon: GraduationCap, text: 'Mid-sem schedule uploaded', time: '2 days ago', color: 'text-purple-400' },
];

export default function StudentDashboard({ onNavigate }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back, {studentData.name.split(' ')[0]} 👋</h2>
          <p className="text-surface-400 mt-1">{studentData.department} • Semester {studentData.semester} • Roll: {studentData.rollNo}</p>
        </div>
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
                  <p className="text-xs text-success mt-1">{m.change}</p>
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
          <div className="space-y-3">
            {attendanceData.subjects.map((s, i) => {
              const pct = Math.round((s.attended / s.total) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-surface-300 w-36 truncate">{s.code}</span>
                  <div className="flex-1 progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-surface-200 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="mt-4 text-sm text-accent-light hover:text-accent font-medium transition-colors"
          >
            View detailed attendance →
          </button>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h3 className="section-title">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-surface-200">{a.text}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Fee Status', desc: '₹25,000 due by Aug 15', action: 'View Fees', section: 'fees', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/20' },
          { title: 'Upcoming Events', desc: '2 new events this week', action: 'Browse Events', section: 'events', color: 'from-accent/20 to-purple-500/20 border-accent/20' },
          { title: 'AI Predictor', desc: 'Check your grade projection', action: 'Try Now', section: 'performance', color: 'from-success/20 to-emerald-500/20 border-success/20' },
        ].map((c, i) => (
          <button
            key={i}
            onClick={() => onNavigate(c.section)}
            className={`card-hover text-left bg-gradient-to-br ${c.color} border animate-slide-up`}
            style={{ animationDelay: `${480 + i * 80}ms` }}
          >
            <h4 className="font-semibold text-white">{c.title}</h4>
            <p className="text-sm text-surface-400 mt-1">{c.desc}</p>
            <p className="text-sm text-accent-light font-medium mt-3">{c.action} →</p>
          </button>
        ))}
      </div>
    </div>
  );
}
