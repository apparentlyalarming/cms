import { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Users, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const categoryColors = {
  Technical: 'bg-accent/15 text-accent-light',
  Cultural: 'bg-purple-500/15 text-purple-400',
  Workshop: 'bg-amber-500/15 text-amber-400',
  Sports: 'bg-success/15 text-success',
  General: 'bg-surface-700/50 text-surface-300',
};

export default function EventRegistration({ user }) {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [eventsRes, regRes] = await Promise.all([
          supabase.from('events').select('*').order('event_date'),
          user ? supabase.from('event_registrations').select('event_id').eq('student_id', user.id) : { data: [] },
        ]);

        if (!cancelled) {
          setEvents(eventsRes.data || []);
          setRegistrations(new Set((regRes.data || []).map(r => r.event_id)));
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

  const toggleRegister = async (eventId) => {
    if (!user) return;
    const isRegistered = registrations.has(eventId);

    if (isRegistered) {
      await supabase.from('event_registrations').delete().eq('event_id', eventId).eq('student_id', user.id);
      setRegistrations(prev => { const next = new Set(prev); next.delete(eventId); return next; });
      setEvents(prev => prev.map(e => e.event_id === eventId ? { ...e, filled_seats: e.filled_seats - 1 } : e));
    } else {
      await supabase.from('event_registrations').insert({ event_id: eventId, student_id: user.id });
      setRegistrations(prev => new Set(prev).add(eventId));
      setEvents(prev => prev.map(e => e.event_id === eventId ? { ...e, filled_seats: e.filled_seats + 1 } : e));
    }
  };

  if (loading) return <LoadingState message="Loading events..." />;
  if (error) return <ErrorState message={error} />;

  const categories = ['All', ...new Set(events.map(e => e.category))];
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
              filter === cat ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface-800/60 text-surface-400 hover:text-white hover:bg-surface-700/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-surface-500 text-center py-10">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((event, i) => {
            const isRegistered = registrations.has(event.event_id);
            const seatsLeft = event.total_seats - event.filled_seats;
            const isFull = seatsLeft === 0;

            return (
              <div key={event.event_id} className="card-hover animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${categoryColors[event.category] || categoryColors.General}`}>
                    {event.category}
                  </span>
                  {isRegistered && (
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
                    {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-300">
                    <Clock className="w-4 h-4 text-surface-500" />
                    {event.event_time}
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
                    <div className="progress-fill bg-accent" style={{ width: `${Math.round((event.filled_seats / event.total_seats) * 100)}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => toggleRegister(event.event_id)}
                  disabled={isFull && !isRegistered}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isRegistered
                      ? 'bg-surface-700/50 text-surface-300 hover:bg-danger/10 hover:text-danger border border-surface-600/50 hover:border-danger/30'
                      : isFull
                      ? 'bg-surface-700/30 text-surface-500 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {isRegistered ? 'Unregister' : isFull ? 'Event Full' : 'Register Now'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
