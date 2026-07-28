import { useState, useEffect } from 'react';
import { Building2, Wifi, UtensilsCrossed, Dumbbell, BookOpen, Shirt, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const amenityIcons = { 'Wi-Fi': Wifi, 'Laundry': Shirt, 'Common Room': UtensilsCrossed, 'Gym': Dumbbell, 'Study Hall': BookOpen };

const statusStyles = {
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/15', label: 'Approved' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/15', label: 'Pending' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/15', label: 'Rejected' },
};

export default function HostelManagement({ user }) {
  const [room, setRoom] = useState(null);
  const [passRequests, setPassRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const { data: assignment } = await supabase
          .from('hostel_assignments')
          .select('room:hostel_rooms(*)')
          .eq('student_id', user.id)
          .single();

        if (!cancelled && assignment?.room) setRoom(assignment.room);

        const { data: passes } = await supabase
          .from('hostel_pass_requests')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (!cancelled) setPassRequests(passes || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <LoadingState message="Loading hostel data..." />;
  if (error) return <ErrorState message={error} />;

  const amenities = ['Wi-Fi', 'Laundry', 'Common Room', 'Gym', 'Study Hall'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Hostel Management</h2>
        <p className="text-surface-400 mt-1">Room details, passes, and amenities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent-light" />
            </div>
            <h3 className="font-semibold text-white">Room Details</h3>
          </div>
          {room ? (
            <div className="space-y-3">
              {[
                { label: 'Room Number', value: room.room_number },
                { label: 'Block', value: room.block },
                { label: 'Room Type', value: room.room_type },
                { label: 'Warden', value: room.warden },
              ].map((d, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm text-surface-400">{d.label}</span>
                  <span className="text-sm font-medium text-white">{d.value || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-500">No room assigned.</p>
          )}
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h3 className="font-semibold text-white mb-4">Amenities</h3>
          <div className="grid grid-cols-2 gap-2">
            {amenities.map((a, i) => {
              const Icon = amenityIcons[a] || Building2;
              return (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-700/30">
                  <Icon className="w-4 h-4 text-accent-light" />
                  <span className="text-sm text-surface-200">{a}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h3 className="font-semibold text-white mb-4">Mess Timings</h3>
          <div className="space-y-2">
            {['Breakfast: 7:30–9:00', 'Lunch: 12:00–13:30', 'Dinner: 19:00–20:30'].map((t, i) => {
              const [meal, time] = t.split(': ');
              return (
                <div key={i} className="p-3 rounded-xl bg-surface-700/30">
                  <p className="text-sm font-medium text-accent-light">{meal}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{time}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">Pass Requests</h3>
          <button className="btn-primary text-sm">+ New Request</button>
        </div>
        {passRequests.length === 0 ? (
          <p className="text-sm text-surface-500">No pass requests yet.</p>
        ) : (
          <div className="space-y-3">
            {passRequests.map((p) => {
              const s = statusStyles[p.status] || statusStyles.pending;
              const Icon = s.icon;
              return (
                <div key={p.request_id} className="flex items-center justify-between p-4 rounded-xl bg-surface-700/30 hover:bg-surface-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{p.pass_type}</p>
                      <p className="text-xs text-surface-500">
                        {new Date(p.request_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
