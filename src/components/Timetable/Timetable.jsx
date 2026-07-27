import { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { timetableData } from '../../data';

const typeColors = {
  lecture: { bg: 'bg-accent/10', text: 'text-accent-light', border: 'border-accent/20' },
  lab: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  tutorial: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
};

export default function Timetable() {
  const [activeDay, setActiveDay] = useState(
    timetableData.days[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1] || 'Monday'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Timetable</h2>
        <p className="text-surface-400 mt-1">Weekly class schedule</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {timetableData.days.map((day) => (
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
        {timetableData.periods.map((period, i) => {
          const class_ = timetableData.schedule[activeDay]?.[i];
          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                class_
                  ? `bg-surface-800/60 border-surface-700/50 hover:border-accent/30`
                  : 'bg-surface-800/20 border-surface-700/20 opacity-50'
              } animate-slide-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-28 flex-shrink-0 text-center">
                <p className="text-xs text-surface-500">{period.label}</p>
                <p className="text-sm font-medium text-surface-300 mt-0.5">{period.time}</p>
              </div>

              <div className="w-px h-10 bg-surface-600/30" />

              {class_ ? (
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{class_.subject}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                        typeColors[class_.type].bg
                      } ${typeColors[class_.type].text} ${typeColors[class_.type].border}`}>
                        {class_.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-surface-500">
                        <MapPin className="w-3 h-3" />
                        {class_.room}
                      </span>
                      <span className="text-xs text-surface-500">{class_.code}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-center">
                  <p className="text-sm text-surface-600">Free Period</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
