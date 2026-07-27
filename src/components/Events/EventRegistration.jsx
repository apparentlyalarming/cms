import { useState } from 'react';
import { CalendarDays, MapPin, Users, Clock, CheckCircle, Tag } from 'lucide-react';
import { eventsData } from '../../data';

const categoryColors = {
  Technical: 'bg-accent/15 text-accent-light',
  Cultural: 'bg-purple-500/15 text-purple-400',
  Workshop: 'bg-amber-500/15 text-amber-400',
  Sports: 'bg-success/15 text-success',
};

export default function EventRegistration() {
  const [events, setEvents] = useState(eventsData);
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...new Set(events.map(e => e.category))];

  const toggleRegister = (id) => {
    setEvents(events.map(e =>
      e.id === id ? { ...e, registered: !e.registered, filled: e.registered ? e.filled - 1 : e.filled + 1 } : e
    ));
  };

  const filtered = filter === 'All' ? events : events.filter(e => e.category === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Campus Events</h2>
        <p className="text-surface-400 mt-1">Discover and register for upcoming events</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              filter === cat
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'bg-surface-800/60 text-surface-400 hover:text-white hover:bg-surface-700/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((event, i) => {
          const seatsLeft = event.seats - event.filled;
          const isFull = seatsLeft === 0;
          const pctFilled = Math.round((event.filled / event.seats) * 100);

          return (
            <div
              key={event.id}
              className="card-hover animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${categoryColors[event.category]}`}>
                  {event.category}
                </span>
                {event.registered && (
                  <span className="badge-success flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Registered
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>
              <p className="text-sm text-surface-400 mb-4 line-clamp-2">{event.description}</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-surface-300">
                  <CalendarDays className="w-4 h-4 text-surface-500" />
                  {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-300">
                  <Clock className="w-4 h-4 text-surface-500" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-300">
                  <MapPin className="w-4 h-4 text-surface-500" />
                  {event.venue}
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-300">
                  <Users className="w-4 h-4 text-surface-500" />
                  {seatsLeft} seats left
                </div>
              </div>

              <div className="mb-4">
                <div className="progress-bar">
                  <div
                    className="progress-fill bg-accent"
                    style={{ width: `${pctFilled}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => toggleRegister(event.id)}
                disabled={isFull && !event.registered}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  event.registered
                    ? 'bg-surface-700/50 text-surface-300 hover:bg-danger/10 hover:text-danger border border-surface-600/50 hover:border-danger/30'
                    : isFull
                    ? 'bg-surface-700/30 text-surface-500 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {event.registered ? 'Unregister' : isFull ? 'Event Full' : 'Register Now'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
