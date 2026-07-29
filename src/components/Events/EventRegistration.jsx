import { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Users, Clock, CheckCircle, Plus, Pencil, Trash2, X } from 'lucide-react';
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

const emptyEvent = {
  title: '', description: '', category: 'General',
  event_date: '', event_time: '', venue: '',
  total_seats: 50, filled_seats: 0,
};

export default function EventRegistration({ user, role }) {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [designation, setDesignation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const isAdmin = designation === 'Admin';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        if (role === 'faculty') {
          const { data: fac } = await supabase.from('faculty').select('designation').eq('faculty_id', user.id).single();
          if (!cancelled && fac) setDesignation(fac.designation);
        }

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
  }, [user, role]);

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

  const handleEventDelete = async (eventId) => {
    if (!confirm('Delete this event and all registrations?')) return;
    await supabase.from('events').delete().eq('event_id', eventId);
    setEvents(prev => prev.filter(e => e.event_id !== eventId));
  };

  const handleEventSave = async () => {
    const { editing, ...body } = editingEvent;
    if (editing) {
      const { data } = await supabase.from('events').update(body).eq('event_id', editing).select().single();
      if (data) setEvents(prev => prev.map(e => e.event_id === editing ? data : e));
    } else {
      const { data } = await supabase.from('events').insert(body).select().single();
      if (data) setEvents(prev => [...prev, data]);
    }
    setShowModal(false);
    setEditingEvent(null);
  };

  if (loading) return <LoadingState message="Loading events..." />;
  if (error) return <ErrorState message={error} />;

  const categories = ['All', ...new Set(events.map(e => e.category))];
  const filtered = filter === 'All' ? events : events.filter(e => e.category === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Campus Events</h2>
          <p className="text-surface-400 mt-1">{isAdmin ? 'Manage campus events' : 'Discover and register for upcoming events'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingEvent({ ...emptyEvent }); setShowModal(true); }}
            className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Event</button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              filter === cat ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface-800/60 text-surface-400 hover:text-white hover:bg-surface-700/50'
            }`}>
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
              <div key={event.event_id} className="card-hover animate-slide-up relative" style={{ animationDelay: `${i * 80}ms` }}>
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    <button onClick={() => { setEditingEvent({ editing: event.event_id, ...event, event_date: event.event_date?.split('T')[0] || event.event_date }); setShowModal(true); }}
                      className="p-1.5 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-400 hover:text-accent-light transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleEventDelete(event.event_id)}
                      className="p-1.5 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-400 hover:text-danger transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${categoryColors[event.category] || categoryColors.General}`}>
                    {event.category}
                  </span>
                  {isRegistered && (
                    <span className="badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Registered</span>
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

                {role !== 'faculty' && (
                  <button onClick={() => toggleRegister(event.event_id)}
                    disabled={isFull && !isRegistered}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isRegistered
                        ? 'bg-surface-700/50 text-surface-300 hover:bg-danger/10 hover:text-danger border border-surface-600/50 hover:border-danger/30'
                        : isFull ? 'bg-surface-700/30 text-surface-500 cursor-not-allowed'
                        : 'btn-primary'
                    }`}>
                    {isRegistered ? 'Unregister' : isFull ? 'Event Full' : 'Register Now'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-surface-700/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editingEvent?.editing ? 'Edit Event' : 'Add Event'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-surface-400 mb-1">Title</label>
                <input type="text" value={editingEvent.title} onChange={e => setEditingEvent(p => ({ ...p, title: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Description</label>
                <textarea value={editingEvent.description} onChange={e => setEditingEvent(p => ({ ...p, description: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Category</label>
                  <select value={editingEvent.category} onChange={e => setEditingEvent(p => ({ ...p, category: e.target.value }))}
                    className="input-field py-2 px-3 text-sm">
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Sports">Sports</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Event Date</label>
                  <input type="date" value={editingEvent.event_date} onChange={e => setEditingEvent(p => ({ ...p, event_date: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Time</label>
                  <input type="text" value={editingEvent.event_time} onChange={e => setEditingEvent(p => ({ ...p, event_time: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" placeholder="e.g. 10:00 AM" />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Venue</label>
                  <input type="text" value={editingEvent.venue} onChange={e => setEditingEvent(p => ({ ...p, venue: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" placeholder="e.g. Auditorium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Total Seats</label>
                  <input type="number" min="1" value={editingEvent.total_seats} onChange={e => setEditingEvent(p => ({ ...p, total_seats: parseInt(e.target.value) || 1 }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Filled Seats</label>
                  <input type="number" min="0" value={editingEvent.filled_seats} onChange={e => setEditingEvent(p => ({ ...p, filled_seats: parseInt(e.target.value) || 0 }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">Cancel</button>
              <button onClick={handleEventSave} disabled={!editingEvent.title}
                className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
