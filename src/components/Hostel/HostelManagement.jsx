import { useState, useEffect } from 'react';
import { Building2, Wifi, UtensilsCrossed, Dumbbell, BookOpen, Shirt, CheckCircle, Clock, XCircle, Plus, Check, X, DoorOpen, UserCheck, Users, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const amenityIcons = { 'Wi-Fi': Wifi, Laundry: Shirt, 'Common Room': UtensilsCrossed, Gym: Dumbbell, 'Study Hall': BookOpen };
const amenities = ['Wi-Fi', 'Laundry', 'Common Room', 'Gym', 'Study Hall'];

const statusStyles = {
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/15', label: 'Approved' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/15', label: 'Pending' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/15', label: 'Rejected' },
};

export default function HostelManagement({ user, role }) {
  const [room, setRoom] = useState(null);
  const [passRequests, setPassRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [designation, setDesignation] = useState(null);

  const [allPassRequests, setAllPassRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [wardenTab, setWardenTab] = useState('passes');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState({ pass_type: 'Night Out', request_date: '', reason: '' });
  const [roomStudents, setRoomStudents] = useState({});

  const isWarden = designation === 'Warden' || designation === 'Admin';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        if (role === 'faculty') {
          const { data: fac } = await supabase.from('faculty').select('designation').eq('faculty_id', user.id).single();
          if (!cancelled && fac) setDesignation(fac.designation);
        }

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

    async function loadWardenData() {
      const [passRes, roomRes] = await Promise.all([
        supabase.from('hostel_pass_requests').select('*, students!inner(roll_number, profile:profiles!inner(full_name, email))').order('created_at', { ascending: false }),
        supabase.from('hostel_rooms').select('*').order('room_number'),
      ]);
      if (!cancelled) {
        setAllPassRequests(passRes.data || []);
        setRooms(roomRes.data || []);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, role]);

  useEffect(() => {
    if (!isWarden || !user) return;
    let cancelled = false;
    async function loadWardenData() {
      const [passRes, roomRes, assignRes] = await Promise.all([
        supabase.from('hostel_pass_requests').select('*, students!inner(roll_number, profile:profiles!inner(full_name, email))').order('created_at', { ascending: false }),
        supabase.from('hostel_rooms').select('*').order('room_number'),
        supabase.from('hostel_assignments').select('*, students!inner(student_id, roll_number, profile:profiles!inner(full_name, email))'),
      ]);
      if (!cancelled) {
        setAllPassRequests(passRes.data || []);
        setRooms(roomRes.data || []);
        const map = {};
        (assignRes.data || []).forEach(a => {
          const rid = a.room_id;
          if (!map[rid]) map[rid] = [];
          map[rid].push({ id: a.students.student_id, roll: a.students.roll_number, name: a.students.profile?.full_name || '' });
        });
        setRoomStudents(map);
      }
    }
    loadWardenData();
    return () => { cancelled = true; };
  }, [isWarden, user]);

  const handlePassStatus = async (reqId, status) => {
    await supabase.from('hostel_pass_requests').update({ status }).eq('request_id', reqId);
    setAllPassRequests(prev => prev.map(r => r.request_id === reqId ? { ...r, status } : r));
  };

  const handleRoomSave = async () => {
    const { editing, ...body } = editingRoom;
    if (editing) {
      await supabase.from('hostel_rooms').update(body).eq('room_id', editing);
      setRooms(prev => prev.map(r => r.room_id === editing ? { ...r, ...body } : r));
    } else {
      const { data } = await supabase.from('hostel_rooms').insert(body).select().single();
      if (data) setRooms(prev => [...prev, data]);
    }
    setShowRoomModal(false);
    setEditingRoom(null);
  };

  const handleRoomDelete = async (roomId) => {
    if (!confirm('Delete this room?')) return;
    await supabase.from('hostel_rooms').delete().eq('room_id', roomId);
    setRooms(prev => prev.filter(r => r.room_id !== roomId));
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('hostel_pass_requests').insert({
      student_id: user.id,
      pass_type: newPass.pass_type,
      request_date: newPass.request_date,
      reason: newPass.reason,
      status: 'pending',
    }).select().single();
    if (error) { setError(error.message); return; }
    setPassRequests(prev => [data, ...prev]);
    setShowPassModal(false);
    setNewPass({ pass_type: 'Night Out', request_date: '', reason: '' });
  };

  if (loading) return <LoadingState message="Loading hostel data..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Hostel Management</h2>
          <p className="text-surface-400 mt-1">{isWarden ? 'Warden dashboard — manage rooms and passes' : 'Room details, passes, and amenities'}</p>
        </div>
      </div>

      {isWarden && (
        <div className="flex gap-2">
          <button onClick={() => setWardenTab('passes')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${wardenTab === 'passes' ? 'bg-accent text-white' : 'bg-surface-800/60 text-surface-400 hover:text-white'}`}>
            <UserCheck className="w-4 h-4 inline mr-1.5" />Pass Requests
          </button>
          <button onClick={() => setWardenTab('rooms')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${wardenTab === 'rooms' ? 'bg-accent text-white' : 'bg-surface-800/60 text-surface-400 hover:text-white'}`}>
            <DoorOpen className="w-4 h-4 inline mr-1.5" />Manage Rooms
          </button>
        </div>
      )}

      {isWarden && wardenTab === 'passes' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">All Pass Requests</h3>
          {allPassRequests.length === 0 ? (
            <p className="text-sm text-surface-500">No pass requests yet.</p>
          ) : (
            allPassRequests.map(p => {
              const s = statusStyles[p.status] || statusStyles.pending;
              const Icon = s.icon;
              return (
                <div key={p.request_id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{p.pass_type}</p>
                      <p className="text-xs text-surface-500">
                        {p.students?.profile?.full_name || 'Unknown'} · {p.students?.roll_number || ''} · {new Date(p.request_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                      {s.label}
                    </span>
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => handlePassStatus(p.request_id, 'approved')} className="p-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePassStatus(p.request_id, 'rejected')} className="p-1.5 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {isWarden && wardenTab === 'rooms' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">All Rooms</h3>
            <button onClick={() => { setEditingRoom({ room_number: '', block: '', room_type: 'Single', warden: '', capacity: 1 }); setShowRoomModal(true); }}
              className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Room</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map(r => (
              <div key={r.room_id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{r.room_number}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{r.block} · {r.room_type} · Cap: {r.capacity}{r.occupied != null ? ` · Occupied: ${r.occupied}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingRoom({ editing: r.room_id, ...r }); setShowRoomModal(true); }}
                      className="p-1 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-light transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleRoomDelete(r.room_id)}
                      className="p-1 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-danger transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {(roomStudents[r.room_id] || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-700/30 space-y-1.5">
                    <p className="text-[11px] font-medium text-surface-500 uppercase tracking-wider">Students</p>
                    {roomStudents[r.room_id].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-surface-300">
                        <User className="w-3 h-3 text-accent-light" />
                        <span>{s.name}</span>
                        <span className="text-surface-500">· {s.roll}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isWarden && (
        <>
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
              <button onClick={() => setShowPassModal(true)} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> New Request</button>
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
                          {p.reason && <p className="text-xs text-surface-400">{p.reason}</p>}
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
        </>
      )}

      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-surface-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">New Pass Request</h3>
              <button onClick={() => setShowPassModal(false)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePassSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-surface-400 mb-1">Pass Type</label>
                <select value={newPass.pass_type} onChange={e => setNewPass(p => ({ ...p, pass_type: e.target.value }))}
                  className="input-field py-2 px-3 text-sm">
                  <option value="Night Out">Night Out</option>
                  <option value="Home Leave">Home Leave</option>
                  <option value="Late Entry">Late Entry</option>
                  <option value="Day Out">Day Out</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Date</label>
                <input type="date" value={newPass.request_date} onChange={e => setNewPass(p => ({ ...p, request_date: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" required />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Reason</label>
                <textarea value={newPass.reason} onChange={e => setNewPass(p => ({ ...p, reason: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" rows={3} placeholder="Optional reason..." />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowPassModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={!newPass.request_date}
                  className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-50">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-surface-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editingRoom?.editing ? 'Edit Room' : 'Add Room'}</h3>
              <button onClick={() => setShowRoomModal(false)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Room Number</label>
                  <input type="text" value={editingRoom.room_number} onChange={e => setEditingRoom(p => ({ ...p, room_number: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Block</label>
                  <input type="text" value={editingRoom.block} onChange={e => setEditingRoom(p => ({ ...p, block: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Room Type</label>
                  <select value={editingRoom.room_type} onChange={e => setEditingRoom(p => ({ ...p, room_type: e.target.value }))}
                    className="input-field py-2 px-3 text-sm">
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Capacity</label>
                  <input type="number" min="1" value={editingRoom.capacity} onChange={e => setEditingRoom(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Warden</label>
                <input type="text" value={editingRoom.warden || ''} onChange={e => setEditingRoom(p => ({ ...p, warden: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRoomModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">Cancel</button>
              <button onClick={handleRoomSave} disabled={!editingRoom.room_number || !editingRoom.block}
                className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
