import { useState } from 'react';
import { BookOpen, TrendingUp, TrendingDown, AlertTriangle, Calculator, ChevronRight } from 'lucide-react';
import { attendanceData } from '../../data';

export default function AttendanceTracker() {
  const [showPredictor, setShowPredictor] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Attendance Tracker</h2>
          <p className="text-surface-400 mt-1">Track your attendance across all subjects</p>
        </div>
        <button
          onClick={() => setShowPredictor(!showPredictor)}
          className="btn-primary flex items-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          AI Predictor
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center animate-slide-up">
          <p className="text-surface-400 text-sm">Overall Attendance</p>
          <p className="metric-value text-white mt-1">{attendanceData.overallPercentage}%</p>
          <div className="mt-3 progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-success to-emerald-400"
              style={{ width: `${attendanceData.overallPercentage}%` }}
            />
          </div>
          <p className="text-xs text-surface-500 mt-2">
            {attendanceData.overallPercentage >= 75 ? '✓ Above minimum requirement' : '⚠ Below 75% requirement'}
          </p>
        </div>
        <div className="card text-center animate-slide-up" style={{ animationDelay: '80ms' }}>
          <p className="text-surface-400 text-sm">Classes Attended</p>
          <p className="metric-value text-success mt-1">{attendanceData.totalAttended}</p>
          <p className="text-xs text-surface-500 mt-2">out of {attendanceData.totalClasses} total</p>
        </div>
        <div className="card text-center animate-slide-up" style={{ animationDelay: '160ms' }}>
          <p className="text-surface-400 text-sm">Classes Missed</p>
          <p className="metric-value text-danger mt-1">{attendanceData.totalClasses - attendanceData.totalAttended}</p>
          <p className="text-xs text-surface-500 mt-2">{attendanceData.totalClasses - attendanceData.totalAttended} absences</p>
        </div>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '240ms' }}>
        <h3 className="section-title">Subject-wise Breakdown</h3>
        <div className="space-y-4">
          {attendanceData.subjects.map((s, i) => {
            const pct = Math.round((s.attended / s.total) * 100);
            const missed = s.total - s.attended;
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
                    <span className={`badge ${
                      status === 'good' ? 'badge-success' :
                      status === 'warning' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {pct}%
                    </span>
                    {status === 'danger' && (
                      <AlertTriangle className="w-4 h-4 text-danger" />
                    )}
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-surface-500">
                  <span>{s.attended} attended</span>
                  <span>{missed} missed</span>
                  <span>{s.total} total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showPredictor && (
        <AttendancePredictor onClose={() => setShowPredictor(false)} />
      )}
    </div>
  );
}

function AttendancePredictor({ onClose }) {
  const [attended, setAttended] = useState(0);
  const [missed, setMissed] = useState(0);

  const totalCurrent = attendanceData.totalClasses + attended + missed;
  const totalAttended = attendanceData.totalAttended + attended;
  const predictedPct = totalCurrent > 0 ? ((totalAttended / totalCurrent) * 100).toFixed(1) : 0;
  const status = predictedPct >= 75 ? 'good' : predictedPct >= 65 ? 'warning' : 'danger';

  const classesNeeded = predictedPct < 75
    ? Math.ceil((0.75 * totalCurrent - totalAttended) / 0.25)
    : 0;

  return (
    <div className="card glow-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-accent-light" />
          </div>
          <h3 className="font-semibold text-white">Attendance Predictor</h3>
          <span className="badge-accent">AI</span>
        </div>
        <button onClick={onClose} className="text-surface-500 hover:text-white transition-colors text-sm">
          ✕
        </button>
      </div>

      <p className="text-sm text-surface-400 mb-4">
        Enter your expected future classes to see your predicted attendance percentage.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-surface-400 mb-1.5">Expected Attended</label>
          <input
            type="number"
            min="0"
            value={attended}
            onChange={(e) => setAttended(parseInt(e.target.value) || 0)}
            className="input-field"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm text-surface-400 mb-1.5">Expected Missed</label>
          <input
            type="number"
            min="0"
            value={missed}
            onChange={(e) => setMissed(parseInt(e.target.value) || 0)}
            className="input-field"
            placeholder="0"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-700/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-surface-400">Predicted Attendance</span>
          <span className={`text-2xl font-bold ${
            status === 'good' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-danger'
          }`}>
            {predictedPct}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${
              status === 'good' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-danger'
            }`}
            style={{ width: `${Math.min(predictedPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-surface-500">
          <span>{totalAttended} / {totalCurrent} classes</span>
          <span>{status === 'good' ? '✓ Safe' : status === 'warning' ? '⚠ Borderline' : '✗ At Risk'}</span>
        </div>
        {classesNeeded > 0 && (
          <p className="mt-3 text-sm text-warning">
            ⚠ You need to attend {classesNeeded} more consecutive classes to reach 75%.
          </p>
        )}
      </div>
    </div>
  );
}
