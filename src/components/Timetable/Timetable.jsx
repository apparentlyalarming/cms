import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const typeColors = {
  lecture: { bg: 'bg-accent/10', text: 'text-accent-light', border: 'border-accent/20' },
  lab: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  tutorial: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
};

export default function Timetable({ user }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date().getDay();
  const [activeDay, setActiveDay] = useState(DAYS[Math.max(0, today - 1)] || 'Monday');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await supabase
          .from('timetable')
          .select('*, course:courses(course_code, course_name)')
          .in('day_of_week', DAYS)
          .order('period');

        if (!cancelled) setSlots(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingState message="Loading timetable..." />;
  if (error) return <ErrorState message={error} />;

  const daySlots = slots.filter(s => s.day_of_week === activeDay);
  const maxPeriod = Math.max(...daySlots.map(s => s.period), 6);

  const schedule = Array.from({ length: maxPeriod }, (_, i) => {
    return daySlots.find(s => s.period === i + 1) || null;
  });

  const periods = Array.from({ length: maxPeriod }, (_, i) => ({
    label: `Period ${i + 1}`,
    time: i < 3
      ? `${9 + i}:00 - ${9 + i}:50`
      : i === 3
      ? '12:00 - 12:50'
      : `${13 + i}:00 - ${13 + i}:50`,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Timetable</h2>
        <p className="text-surface-400 mt-1">Weekly class schedule</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeDay === day
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'bg-surface-800/60 text-surface-400 hover:text-white hover:bg-surface-700/50'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {schedule.map((class_, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
              class_
                ? 'bg-surface-800/60 border-surface-700/50 hover:border-accent/30'
                : 'bg-surface-800/20 border-surface-700/20 opacity-50'
            } animate-slide-up`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="w-28 flex-shrink-0 text-center">
              <p className="text-xs text-surface-500">{periods[i]?.label}</p>
              <p className="text-sm font-medium text-surface-300 mt-0.5">{periods[i]?.time}</p>
            </div>
            <div className="w-px h-10 bg-surface-600/30" />
            {class_ ? (
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">{class_.course?.course_name || 'Unknown'}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${typeColors[class_.slot_type]?.bg || ''} ${typeColors[class_.slot_type]?.text || ''} ${typeColors[class_.slot_type]?.border || ''}`}>
                    {class_.slot_type}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-surface-500"><MapPin className="w-3 h-3" />{class_.room}</span>
                  <span className="text-xs text-surface-500">{class_.course?.course_code}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 text-center"><p className="text-sm text-surface-600">Free Period</p></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
