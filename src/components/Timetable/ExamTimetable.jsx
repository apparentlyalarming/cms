import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, X, Save, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const DEPARTMENTS = ['CSE', 'Cybersecurity', 'AIML', 'Electronics and Communication', 'Mech'];

const typeColors = {
  midsem: { bg: 'bg-accent/10', text: 'text-accent-light', border: 'border-accent/20' },
  endsem: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  quiz: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  lab_test: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

const emptyExam = {
  department: 'CSE', semester: 1, subject_name: '',
  exam_date: '', start_time: '09:00', end_time: '11:00',
  venue: '', exam_type: 'endsem',
};

export default function ExamTimetable({ user, role }) {
  const [exams, setExams] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterDept, setFilterDept] = useState('CSE');
  const [filterSem, setFilterSem] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

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

        const { data } = await supabase
          .from('exams')
          .select('*')
          .eq('department', dept)
          .eq('semester', sem)
          .order('exam_date')
          .order('start_time');

        if (!cancelled) setExams(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, isFaculty, filterDept, filterSem, studentInfo]);

  const openAdd = () => {
    setEditingExam({ ...emptyExam, department: filterDept, semester: filterSem });
    setShowModal(true);
  };

  const openEdit = (exam) => {
    setEditingExam({ ...exam, exam_date: exam.exam_date?.split('T')[0] || exam.exam_date });
    setShowModal(true);
  };

  const handleDelete = async (examId) => {
    if (!confirm('Delete this exam entry?')) return;
    await supabase.from('exams').delete().eq('exam_id', examId);
    setExams(prev => prev.filter(e => e.exam_id !== examId));
  };

  const handleSave = async () => {
    const { exam_id, created_at, ...body } = editingExam;
    if (!body.subject_name || !body.exam_date || !body.venue) return;

    if (exam_id) {
      const { data } = await supabase.from('exams').update(body).eq('exam_id', exam_id).select().single();
      if (data) setExams(prev => prev.map(e => e.exam_id === exam_id ? data : e));
    } else {
      const { data } = await supabase.from('exams').insert(body).select().single();
      if (data) setExams(prev => [...prev, data]);
    }
    setShowModal(false);
    setEditingExam(null);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <LoadingState message="Loading exam timetable..." />;
  if (error) return <ErrorState message={error} />;

  const upcoming = exams.filter(e => new Date(e.exam_date + 'T23:59:59') >= new Date());
  const past = exams.filter(e => new Date(e.exam_date + 'T23:59:59') < new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Exam Timetable</h2>
          <p className="text-surface-400 mt-1">Upcoming and past examinations</p>
        </div>
        {isFaculty && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Exam
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
        </div>
      )}

      {!isFaculty && studentInfo && (
        <p className="text-sm text-surface-400">
          {studentInfo.department} · Semester {studentInfo.semester}
        </p>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-light" /> Upcoming Exams
          </h3>
          <div className="grid gap-3">
            {upcoming.map((exam, i) => (
              <div key={exam.exam_id}
                className="flex items-start gap-4 p-4 rounded-xl border bg-surface-800/60 border-surface-700/50 hover:border-accent/30 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => isFaculty && openEdit(exam)}>
                <div className="w-16 h-16 rounded-xl bg-accent/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-accent-light">{new Date(exam.exam_date + 'T00:00:00').getDate()}</span>
                  <span className="text-[10px] text-accent-light/70 uppercase">{new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-white">{exam.subject_name}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${typeColors[exam.exam_type]?.bg || ''} ${typeColors[exam.exam_type]?.text || ''} ${typeColors[exam.exam_type]?.border || ''}`}>
                      {exam.exam_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-surface-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-surface-500" />
                      {formatDate(exam.exam_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-surface-500" />
                      {exam.start_time?.slice(0, 5)} - {exam.end_time?.slice(0, 5)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-surface-500" />
                      {exam.venue}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-surface-500" />
                      Sem {exam.semester} · {exam.department}
                    </span>
                  </div>
                </div>
                {isFaculty && (
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(exam)} className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-light transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(exam.exam_id)} className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-danger transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && (
        <div className="text-center py-12 bg-surface-800/30 rounded-2xl border border-surface-700/30">
          <Calendar className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 font-medium">No upcoming exams scheduled</p>
          <p className="text-surface-500 text-sm mt-1">Exams will appear here once scheduled by faculty</p>
        </div>
      )}

      {past.length > 0 && (
        <div className="pt-4">
          <details className="group">
            <summary className="cursor-pointer text-sm text-surface-500 hover:text-surface-300 transition-colors flex items-center gap-2">
              <span className="w-4 h-px bg-surface-600 group-open:rotate-0" />
              Past Exams ({past.length})
            </summary>
            <div className="mt-3 grid gap-2">
              {past.map((exam) => (
                <div key={exam.exam_id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-surface-800/30 border border-surface-700/30 opacity-60">
                  <div className="w-12 h-12 rounded-lg bg-surface-700/50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-surface-400">{new Date(exam.exam_date + 'T00:00:00').getDate()}</span>
                    <span className="text-[9px] text-surface-500 uppercase">{new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-surface-300">{exam.subject_name}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${typeColors[exam.exam_type]?.bg || ''} ${typeColors[exam.exam_type]?.text || ''} ${typeColors[exam.exam_type]?.border || ''}`}>
                        {exam.exam_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">{exam.venue} · {exam.start_time?.slice(0, 5)} - {exam.end_time?.slice(0, 5)}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-surface-700/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editingExam?.exam_id ? 'Edit Exam' : 'Add Exam'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Department</label>
                  <select value={editingExam.department} onChange={e => setEditingExam(p => ({ ...p, department: e.target.value }))}
                    className="input-field py-2 px-3 text-sm">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Semester</label>
                  <select value={editingExam.semester} onChange={e => setEditingExam(p => ({ ...p, semester: Number(e.target.value) }))}
                    className="input-field py-2 px-3 text-sm">
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Sem {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1">Subject Name</label>
                <input type="text" value={editingExam.subject_name} onChange={e => setEditingExam(p => ({ ...p, subject_name: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" placeholder="e.g. Data Structures" />
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1">Exam Date</label>
                <input type="date" value={editingExam.exam_date} onChange={e => setEditingExam(p => ({ ...p, exam_date: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Start Time</label>
                  <input type="time" value={editingExam.start_time} onChange={e => setEditingExam(p => ({ ...p, start_time: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">End Time</label>
                  <input type="time" value={editingExam.end_time} onChange={e => setEditingExam(p => ({ ...p, end_time: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1">Venue / Room</label>
                <input type="text" value={editingExam.venue} onChange={e => setEditingExam(p => ({ ...p, venue: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" placeholder="e.g. A-301, Lab Block" />
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1">Exam Type</label>
                <select value={editingExam.exam_type} onChange={e => setEditingExam(p => ({ ...p, exam_type: e.target.value }))}
                  className="input-field py-2 px-3 text-sm">
                  <option value="endsem">End Semester</option>
                  <option value="midsem">Mid Semester</option>
                  <option value="quiz">Quiz</option>
                  <option value="lab_test">Lab Test</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!editingExam.subject_name || !editingExam.exam_date || !editingExam.venue}
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
