import { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const DEPARTMENTS = ['CSE', 'Cybersecurity', 'AIML', 'Electronics and Communication', 'Mech'];

export default function FacultyAttendance({ user }) {
  const [department, setDepartment] = useState('CSE');
  const [semester, setSemester] = useState(1);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function loadCourses() {
      const { data } = await supabase
        .from('courses')
        .select('course_id, course_code, course_name')
        .eq('department', department);
      setCourses(data || []);
      setSelectedCourse('');
    }
    loadCourses();
  }, [department]);

  const fetchStudents = async () => {
    if (!selectedCourse || !classDate) return;
    setLoading(true);
    setError(null);
    try {
      const { data: enrolled } = await supabase
        .from('enrollments')
        .select('student_id, enrollment_id')
        .eq('course_id', selectedCourse)
        .eq('status', 'enrolled');

      if (!enrolled || enrolled.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = enrolled.map(e => e.student_id);

      const { data: students } = await supabase
        .from('students')
        .select('student_id, roll_number, department, semester')
        .in('student_id', studentIds);

      const studentMap = {};
      (students || []).forEach(s => { studentMap[s.student_id] = s; });

      const filtered = enrolled.filter(e => {
        const s = studentMap[e.student_id];
        return s?.department === department && s?.semester === semester;
      });

      const filteredIds = filtered.map(e => e.student_id);

      const { data: existing } = await supabase
        .from('attendance')
        .select('enrollment_id, status')
        .in('enrollment_id', filtered.map(e => e.enrollment_id))
        .eq('class_date', classDate);

      const existingMap = {};
      (existing || []).forEach(a => { existingMap[a.enrollment_id] = a.status; });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', filteredIds);

      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p.full_name; });

      setStudents(filtered.map(e => ({
        student_id: e.student_id,
        enrollment_id: e.enrollment_id,
        roll_number: studentMap[e.student_id]?.roll_number || '—',
        full_name: profileMap[e.student_id] || 'Unknown',
      })));

      const initAttendance = {};
      filtered.forEach(e => { initAttendance[e.enrollment_id] = existingMap[e.enrollment_id] || 'present'; });
      setAttendance(initAttendance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse && classDate) fetchStudents();
  }, [selectedCourse, classDate]);

  const toggleStatus = (enrollmentId) => {
    setAttendance(prev => ({
      ...prev,
      [enrollmentId]: prev[enrollmentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const rows = Object.entries(attendance).map(([enrollment_id, status]) => ({
        enrollment_id,
        class_date: classDate,
        status,
      }));

      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'enrollment_id, class_date' });

      if (upsertError) throw upsertError;
      setSuccess('Attendance saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Manage Attendance</h2>
        <p className="text-surface-400 mt-1">Mark attendance for your classes</p>
      </div>

      <div className="flex gap-4 flex-wrap items-end">
        <div>
          <label className="block text-xs text-surface-400 mb-1">Department</label>
          <select value={department} onChange={e => setDepartment(e.target.value)}
            className="input-field py-2 px-3 text-sm">
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-surface-400 mb-1">Semester</label>
          <select value={semester} onChange={e => setSemester(Number(e.target.value))}
            className="input-field py-2 px-3 text-sm">
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Sem {i + 1}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-surface-400 mb-1">Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="input-field py-2 px-3 text-sm">
            <option value="">Select course</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.course_code} – {c.course_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-surface-400 mb-1">Date</label>
          <input type="date" value={classDate} onChange={e => setClassDate(e.target.value)}
            className="input-field py-2 px-3 text-sm" />
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">{error}</div>}
      {success && <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-sm text-success flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      {loading && <LoadingState message="Loading students..." />}

      {!loading && students.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50">
                  <th className="text-left p-3 text-surface-400 font-medium">#</th>
                  <th className="text-left p-3 text-surface-400 font-medium">Roll No</th>
                  <th className="text-left p-3 text-surface-400 font-medium">Name</th>
                  <th className="text-center p-3 text-surface-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.enrollment_id} className="border-b border-surface-700/20 hover:bg-surface-700/20 transition-colors">
                    <td className="p-3 text-surface-500">{i + 1}</td>
                    <td className="p-3 text-surface-300">{s.roll_number}</td>
                    <td className="p-3 text-white">{s.full_name}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleStatus(s.enrollment_id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          attendance[s.enrollment_id] === 'present'
                            ? 'bg-success/15 text-success border border-success/30'
                            : 'bg-danger/15 text-danger border border-danger/30'
                        }`}>
                        {attendance[s.enrollment_id] === 'present' ? (
                          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Present</span>
                        ) : (
                          <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Absent</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-surface-700/50 flex justify-end">
            <button onClick={saveAttendance} disabled={saving}
              className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {!loading && students.length === 0 && selectedCourse && (
        <p className="text-sm text-surface-500 text-center py-10">No enrolled students found for this course.</p>
      )}
    </div>
  );
}
