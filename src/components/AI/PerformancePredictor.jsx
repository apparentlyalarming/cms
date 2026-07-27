import { useState, useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { performanceData } from '../../data';

const gradeScale = [
  { min: 90, grade: 'A+', color: 'text-success' },
  { min: 80, grade: 'A', color: 'text-success' },
  { min: 70, grade: 'B+', color: 'text-accent-light' },
  { min: 60, grade: 'B', color: 'text-accent-light' },
  { min: 50, grade: 'C', color: 'text-warning' },
  { min: 40, grade: 'D', color: 'text-warning' },
  { min: 0, grade: 'F', color: 'text-danger' },
];

function getGrade(score) {
  return gradeScale.find(g => score >= g.min);
}

function predictGrade(quizAvg, assignmentAvg, midsem) {
  const predicted = quizAvg * 0.25 + assignmentAvg * 0.35 + midsem * 0.40;
  return predicted;
}

export default function PerformancePredictor() {
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [futureScores, setFutureScores] = useState({});

  const subjectAnalytics = useMemo(() => {
    return performanceData.subjects.map((s, idx) => {
      const quizAvg = s.quizzes.reduce((a, b) => a + b, 0) / s.quizzes.length;
      const assignmentAvg = s.assignments.reduce((a, b) => a + b, 0) / s.assignments.length;
      const currentScore = predictGrade(quizAvg, assignmentAvg, s.midsem);
      const currentGrade = getGrade(currentScore);

      const future = futureScores[idx] || { endsem: 80 };
      const futureScore = predictGrade(
        (quizAvg * s.quizzes.length + (future.quiz || quizAvg)) / (s.quizzes.length + 1),
        (assignmentAvg * s.assignments.length + (future.assignment || assignmentAvg)) / (s.assignments.length + 1),
        future.midsem || s.midsem
      );
      const futureGrade = getGrade(futureScore);

      const endsemPredicted = (futureScore - (quizAvg * 0.25 + assignmentAvg * 0.35)) / 0.40;
      const targetEndsem = Math.max(0, Math.min(100, (75 - quizAvg * 0.25 - assignmentAvg * 0.35) / 0.40));

      return {
        name: s.name,
        quizAvg: quizAvg.toFixed(1),
        assignmentAvg: assignmentAvg.toFixed(1),
        midsem: s.midsem,
        currentScore: currentScore.toFixed(1),
        currentGrade,
        futureScore: futureScore.toFixed(1),
        futureGrade,
        endsemPredicted: Math.round(endsemPredicted),
        targetEndsem: Math.round(targetEndsem),
        trend: futureScore > currentScore ? 'up' : futureScore < currentScore ? 'down' : 'same',
      };
    });
  }, [futureScores]);

  const overallGPA = useMemo(() => {
    const total = subjectAnalytics.reduce((sum, s) => sum + parseFloat(s.futureScore), 0) / subjectAnalytics.length;
    return (total / 10).toFixed(2);
  }, [subjectAnalytics]);

  const updateFuture = (idx, key, value) => {
    setFutureScores(prev => ({
      ...prev,
      [idx]: { ...prev[idx], [key]: parseInt(value) || 0 },
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Performance Predictor</h2>
          <p className="text-surface-400 mt-0.5">Predict your grades based on current and expected scores</p>
        </div>
        <span className="badge-accent ml-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI</span>
      </div>

      <div className="card glow-border animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-surface-400 text-sm">Predicted End-Semester GPA</p>
            <p className="metric-value text-white mt-1">{overallGPA}<span className="text-base font-normal text-surface-500">/10</span></p>
          </div>
          <div className="text-right">
            <p className="text-surface-400 text-sm">Average Score</p>
            <p className={`text-xl font-bold mt-1 ${
              parseFloat(overallGPA) >= 8 ? 'text-success' :
              parseFloat(overallGPA) >= 6 ? 'text-accent-light' : 'text-warning'
            }`}>
              {((parseFloat(overallGPA)) * 10).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {subjectAnalytics.map((s, i) => {
          const isExpanded = expandedSubject === i;
          return (
            <div
              key={i}
              className="card animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : i)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{s.name}</h4>
                      {s.trend === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
                      {s.trend === 'down' && <TrendingDown className="w-4 h-4 text-danger" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-surface-500">Current: <span className={`font-semibold ${s.currentGrade.color}`}>{s.currentGrade.grade}</span> ({s.currentScore}%)</span>
                      <span className="text-xs text-surface-600">→</span>
                      <span className="text-xs text-surface-500">Predicted: <span className={`font-semibold ${s.futureGrade.color}`}>{s.futureGrade.grade}</span> ({s.futureScore}%)</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-surface-500" /> : <ChevronDown className="w-4 h-4 text-surface-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-surface-700/30 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Current Performance</h5>
                      <div className="space-y-2">
                        {[
                          { label: 'Quiz Average', value: `${s.quizAvg}%` },
                          { label: 'Assignment Average', value: `${s.assignmentAvg}%` },
                          { label: 'Mid-Semester', value: `${s.midsem}%` },
                        ].map((m, j) => (
                          <div key={j} className="flex justify-between text-sm">
                            <span className="text-surface-400">{m.label}</span>
                            <span className="text-white font-medium">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Predict Your Future Score</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-surface-500 mb-1">Expected Next Quiz (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={futureScores[i]?.quiz || ''}
                            onChange={(e) => updateFuture(i, 'quiz', e.target.value)}
                            className="input-field text-sm"
                            placeholder={`Current avg: ${s.quizAvg}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-surface-500 mb-1">Expected End-Sem (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={futureScores[i]?.endsem || ''}
                            onChange={(e) => updateFuture(i, 'endsem', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Enter expected end-sem score"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-surface-900/40 border border-surface-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-accent-light" />
                      <span className="text-xs font-semibold text-surface-300">AI Insight</span>
                    </div>
                    <p className="text-sm text-surface-400">
                      {parseFloat(s.futureScore) >= 80
                        ? `You're on track for a strong ${s.futureGrade.grade}. Keep this momentum!`
                        : parseFloat(s.futureScore) >= 60
                        ? `A solid ${s.futureGrade.grade} is within reach. Focus on end-semester preparation.`
                        : `To reach a B grade, aim for at least ${s.targetEndsem}% in end-sem examinations.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
