import { useState, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DEPARTMENTS = ['CSE', 'Cybersecurity', 'AIML', 'Electronics and Communication', 'Mech'];

const typeColors = {
  lecture: { bg: 'bg-accent/10', text: 'text-accent-light', border: 'border-accent/20' },
  lab: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  tutorial: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
};

const emptySlot = {
  department: 'CSE', semester: 1, day_of_week: 'Monday',
  period: 1, start_time: '09:00', end_time: '09:50',
  subject_name: '', faculty_id: null, room: '', slot_type: 'lecture',
};

export default function Timetable({ user, role }) {
  const [slots, setSlots] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(DAYS[Math.max(0, new Date().getDay() - 1)] || 'Monday');

  const [filterDept, setFilterDept] = useState('CSE');
  const [filterSem, setFilterSem] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [facultyList, setFacultyList] = useState([]);

  const isFaculty = role === 'faculty';

  useEffect(() => {
    let cancelled = false;

    async function initStudent() {
      if (isFaculty) return;
      const { data: stu } = await supabase
        .from('students')
        .select('department, semester')
        .eq('student_id', user.id)
        .single();
      if (stu && !cancelled) {
        setStudentInfo(stu);
        setFilterDept(stu.department);
        setFilterSem(stu.semester);
      }
    }

    initStudent();
    return () => { cancelled = true; };
  }, [user, isFaculty]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!isFaculty && !studentInfo) return;

        setLoading(true);

        const dept = isFaculty ? filterDept : studentInfo.department;
        const sem = isFaculty ? filterSem : studentInfo.semester;

        const { data: fac } = await supabase
          .from('faculty')
          .select('faculty_id, employee_id')
          .limit(50);
        if (!cancelled && fac) setFacultyList(fac);

        const { data } = await supabase
          .from('timetable')
          .select('*')
          .eq('department', dept)
          .eq('semester', sem)
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
  }, [user, isFaculty, filterDept, filterSem, studentInfo]);

  const daySlots = slots.filter(s => s.day_of_week === activeDay);
  const maxPeriod = Math.max(...daySlots.map(s => s.period), 6);

  const schedule = Array.from({ length: maxPeriod }, (_, i) =>
    daySlots.find(s => s.period === i + 1) || null
  );

  const periods = Array.from({ length: maxPeriod }, (_, i) => ({
    label: `Period ${i + 1}`,
    time: i < 3
      ? `${9 + i}:00 - ${9 + i}:50`
      : i === 3 ? '12:00 - 12:50'
      : `${13 + i}:00 - ${13 + i}:50`,
  }));

  const openAdd = () => {
    setEditingSlot({ ...emptySlot, department: filterDept, semester: filterSem, day_of_week: activeDay });
    setShowModal(true);
  };

  const openEdit = (slot) => {
    setEditingSlot({ ...slot });
    setShowModal(true);
  };

  const handleDelete = async (slotId) => {
    if (!confirm('Delete this timetable entry?')) return;
    await supabase.from('timetable').delete().eq('slot_id', slotId);
    setSlots(prev => prev.filter(s => s.slot_id !== slotId));
  };

  const handleSave = async () => {
    const { slot_id, ...body } = editingSlot;
    if (!body.subject_name) return;

    if (slot_id) {
      const { data } = await supabase.from('timetable').update(body).eq('slot_id', slot_id).select().single();
      if (data) setSlots(prev => prev.map(s => s.slot_id === slot_id ? data : s));
    } else {
      const { data } = await supabase.from('timetable').insert(body).select().single();
      if (data) setSlots(prev => [...prev, data]);
    }
    setShowModal(false);
    setEditingSlot(null);
  };

  if (loading) return <LoadingState message="Loading timetable..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Timetable</h2>
          <p className="text-surface-400 mt-1">Weekly class schedule</p>
        </div>
        {isFaculty && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Class
          </button>
        )}
      </div>

      {isFaculty && (
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-surface-400 mb-1">Department</label>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="input-field py-2 px-3 text-sm">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-surface-400 mb-1">Semester</label>
            <select value={filterSem} onChange={e => setFilterSem(Number(e.target.value))}
              className="input-field py-2 px-3 text-sm">
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Sem {i + 1}</option>
              ))}
            </select>
          </div>
          {studentInfo && (
            <div className="flex items-end text-sm text-surface-400">
              Viewing: {filterDept} · Semester {filterSem}
            </div>
          )}
        </div>
      )}

      {!isFaculty && studentInfo && (
        <p className="text-sm text-surface-400">
          {studentInfo.department} · Semester {studentInfo.semester}
        </p>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map(day => (
          <button key={day} onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeDay === day
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'bg-surface-800/60 text-surface-400 hover:text-white hover:bg-surface-700/50'
            }`}>
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {schedule.map((class_, i) => (
          <div key={i}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
              class_
                ? 'bg-surface-800/60 border-surface-700/50 hover:border-accent/30'
                : 'bg-surface-800/20 border-surface-700/20 opacity-50'
            } animate-slide-up`}
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => isFaculty && class_ && openEdit(class_)}>
            <div className="w-28 flex-shrink-0 text-center">
              <p className="text-xs text-surface-500">{periods[i]?.label}</p>
              <p className="text-sm font-medium text-surface-300 mt-0.5">{periods[i]?.time}</p>
            </div>
            <div className="w-px h-10 bg-surface-600/30" />
            {class_ ? (
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">{class_.subject_name}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${typeColors[class_.slot_type]?.bg || ''} ${typeColors[class_.slot_type]?.text || ''} ${typeColors[class_.slot_type]?.border || ''}`}>
                    {class_.slot_type}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-surface-500"><MapPin className="w-3 h-3" />{class_.room}</span>
                  {class_.faculty_id && <span className="text-xs text-surface-500">Faculty: {class_.faculty_id?.slice(0, 8)}</span>}
                </div>
              </div>
            ) : (
              <div className="flex-1 text-center"><p className="text-sm text-surface-600">Free Period</p></div>
            )}
            {isFaculty && class_ && (
              <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(class_)} className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-light transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(class_.slot_id)} className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-surface-700/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editingSlot?.slot_id ? 'Edit Class' : 'Add Class'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Department</label>
                  <select value={editingSlot.department} onChange={e => setEditingSlot(p => ({ ...p, department: e.target.value }))}
                    className="input-field py-2 px-3 text-sm">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Semester</label>
                  <select value={editingSlot.semester} onChange={e => setEditingSlot(p => ({ ...p, semester: Number(e.target.value) }))}
                    className="input-field py-2 px-3 text-sm">
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Sem {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Day</label>
                  <select value={editingSlot.day_of_week} onChange={e => setEditingSlot(p => ({ ...p, day_of_week: e.target.value }))}
                    className="input-field py-2 px-3 text-sm">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Period</label>
                  <select value={editingSlot.period} onChange={e => setEditingSlot(p => ({ ...p, period: Number(e.target.value) }))}
                    className="input-field py-2 px-3 text-sm">
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Period {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Start Time</label>
                  <input type="time" value={editingSlot.start_time} onChange={e => setEditingSlot(p => ({ ...p, start_time: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">End Time</label>
                  <input type="time" value={editingSlot.end_time} onChange={e => setEditingSlot(p => ({ ...p, end_time: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1">Subject Name</label>
                <input type="text" value={editingSlot.subject_name} onChange={e => setEditingSlot(p => ({ ...p, subject_name: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" placeholder="e.g. Data Structures" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Room</label>
                  <input type="text" value={editingSlot.room} onChange={e => setEditingSlot(p => ({ ...p, room: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" placeholder="A-301" />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Type</label>
                  <select value={editingSlot.slot_type} onChange={e => setEditingSlot(p => ({ ...p, slot_type: e.target.value }))}
                    className="input-field py-2 px-3 text-sm">
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!editingSlot.subject_name}
                className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
