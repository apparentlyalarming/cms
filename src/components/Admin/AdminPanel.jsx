import { useState, useEffect } from 'react';
import { Users, GraduationCap, Building2, Pencil, Trash2, X, Check, XCircle, Plus, Search, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const DEPARTMENTS = ['CSE', 'Cybersecurity', 'AIML', 'Electronics and Communication', 'Mech'];

export default function AdminPanel({ user, role }) {
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ roll_number: '', full_name: '', email: '', department: 'CSE', semester: 1 });
  const [newFaculty, setNewFaculty] = useState({ employee_id: '', full_name: '', email: '', department: 'CSE', designation: 'Assistant Professor' });
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [sRes, fRes] = await Promise.all([
      supabase.from('students').select('*, profiles!inner(full_name, email)').order('roll_number'),
      supabase.from('faculty').select('*, profiles!inner(full_name, email)').order('employee_id'),
    ]);
    setStudents(sRes.data || []);
    setFaculty(fRes.data || []);
    setLoading(false);
    if (sRes.error) setError(sRes.error.message);
    if (fRes.error) setError(fRes.error.message);
  }

  const handleStudentSave = async (e) => {
    e.preventDefault();
    setModalError('');
    if (editingStudent) {
      const { error: err } = await supabase.from('students').update({
        roll_number: editingStudent.roll_number,
        department: editingStudent.department,
        semester: editingStudent.semester,
      }).eq('student_id', editingStudent.student_id);
      if (err) { setModalError(err.message); return; }
      setEditingStudent(null);
    } else {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: newStudent.email,
        password: 'student123',
        options: { data: { full_name: newStudent.full_name, role: 'student' } },
      });
      if (authErr) { setModalError(authErr.message); return; }
      if (authData.user) {
        const { error: insErr } = await supabase.from('students').insert({
          student_id: authData.user.id,
          roll_number: newStudent.roll_number,
          department: newStudent.department,
          semester: newStudent.semester,
        });
        if (insErr) { setModalError(insErr.message); return; }
      }
    }
    setShowStudentModal(false);
    setNewStudent({ roll_number: '', full_name: '', email: '', department: 'CSE', semester: 1 });
    loadAll();
  };

  const handleFacultySave = async (e) => {
    e.preventDefault();
    setModalError('');
    if (editingFaculty) {
      const { error: err } = await supabase.from('faculty').update({
        employee_id: editingFaculty.employee_id,
        department: editingFaculty.department,
        designation: editingFaculty.designation,
      }).eq('faculty_id', editingFaculty.faculty_id);
      if (err) { setModalError(err.message); return; }
      setEditingFaculty(null);
    } else {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: newFaculty.email,
        password: 'faculty123',
        options: { data: { full_name: newFaculty.full_name, role: 'faculty' } },
      });
      if (authErr) { setModalError(authErr.message); return; }
      if (authData.user) {
        const { error: insErr } = await supabase.from('faculty').insert({
          faculty_id: authData.user.id,
          employee_id: newFaculty.employee_id,
          department: newFaculty.department,
          designation: newFaculty.designation,
        });
        if (insErr) { setModalError(insErr.message); return; }
      }
    }
    setShowFacultyModal(false);
    setNewFaculty({ employee_id: '', full_name: '', email: '', department: 'CSE', designation: 'Assistant Professor' });
    loadAll();
  };

  const handleStudentDelete = async (id) => {
    if (!confirm('Delete this student? This cannot be undone.')) return;
    await supabase.from('students').delete().eq('student_id', id);
    await supabase.auth.admin.deleteUser(id);
    loadAll();
  };

  const handleFacultyDelete = async (id) => {
    if (!confirm('Delete this faculty member? This cannot be undone.')) return;
    await supabase.from('faculty').delete().eq('faculty_id', id);
    await supabase.auth.admin.deleteUser(id);
    loadAll();
  };

  const filteredStudents = students.filter(s =>
    s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFaculty = faculty.filter(f =>
    f.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState message="Loading admin data..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          <p className="text-surface-400 mt-1">Manage students and faculty accounts</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('students')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'students' ? 'bg-accent text-white' : 'bg-surface-800/60 text-surface-400 hover:text-white'}`}>
          <GraduationCap className="w-4 h-4 inline mr-1.5" />Students ({students.length})
        </button>
        <button onClick={() => setTab('faculty')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'faculty' ? 'bg-accent text-white' : 'bg-surface-800/60 text-surface-400 hover:text-white'}`}>
          <Users className="w-4 h-4 inline mr-1.5" />Faculty ({faculty.length})
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm" placeholder="Search by name or ID..." />
        </div>
        <button onClick={() => tab === 'students' ? setShowStudentModal(true) : setShowFacultyModal(true)}
          className="btn-primary text-sm flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Add {tab === 'students' ? 'Student' : 'Faculty'}</button>
      </div>

      {tab === 'students' && (
        <div className="space-y-2">
          {filteredStudents.length === 0 ? (
            <p className="text-sm text-surface-500">No students found.</p>
          ) : filteredStudents.map(s => (
            <div key={s.student_id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-accent-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{s.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-surface-500">
                    {s.roll_number} · {s.department} · Sem {s.semester} · {s.profiles?.email || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingStudent({ ...s }); setShowStudentModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-light transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleStudentDelete(s.student_id)}
                  className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'faculty' && (
        <div className="space-y-2">
          {filteredFaculty.length === 0 ? (
            <p className="text-sm text-surface-500">No faculty found.</p>
          ) : filteredFaculty.map(f => (
            <div key={f.faculty_id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{f.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-surface-500">
                    {f.employee_id} · {f.department} · {f.designation} · {f.profiles?.email || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingFaculty({ ...f }); setShowFacultyModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-light transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleFacultyDelete(f.faculty_id)}
                  className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-surface-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editingStudent ? 'Edit Student' : 'Add Student'}</h3>
              <button onClick={() => { setShowStudentModal(false); setEditingStudent(null); setModalError(''); }} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStudentSave} className="space-y-3">
              {modalError && <p className="text-xs text-danger bg-danger/10 p-2 rounded-lg">{modalError}</p>}
              {editingStudent ? (
                <>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Roll Number</label>
                    <input type="text" value={editingStudent.roll_number} onChange={e => setEditingStudent(p => ({ ...p, roll_number: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Department</label>
                    <select value={editingStudent.department} onChange={e => setEditingStudent(p => ({ ...p, department: e.target.value }))}
                      className="input-field py-2 px-3 text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Semester</label>
                    <input type="number" min="1" max="8" value={editingStudent.semester} onChange={e => setEditingStudent(p => ({ ...p, semester: parseInt(e.target.value) || 1 }))}
                      className="input-field py-2 px-3 text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Full Name</label>
                    <input type="text" value={newStudent.full_name} onChange={e => setNewStudent(p => ({ ...p, full_name: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Email</label>
                    <input type="email" value={newStudent.email} onChange={e => setNewStudent(p => ({ ...p, email: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Roll Number</label>
                    <input type="text" value={newStudent.roll_number} onChange={e => setNewStudent(p => ({ ...p, roll_number: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Department</label>
                    <select value={newStudent.department} onChange={e => setNewStudent(p => ({ ...p, department: e.target.value }))}
                      className="input-field py-2 px-3 text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Semester</label>
                    <input type="number" min="1" max="8" value={newStudent.semester} onChange={e => setNewStudent(p => ({ ...p, semester: parseInt(e.target.value) || 1 }))}
                      className="input-field py-2 px-3 text-sm" />
                  </div>
                </>
              )}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowStudentModal(false); setEditingStudent(null); setModalError(''); }} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-colors">{editingStudent ? 'Save' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-surface-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editingFaculty ? 'Edit Faculty' : 'Add Faculty'}</h3>
              <button onClick={() => { setShowFacultyModal(false); setEditingFaculty(null); setModalError(''); }} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFacultySave} className="space-y-3">
              {modalError && <p className="text-xs text-danger bg-danger/10 p-2 rounded-lg">{modalError}</p>}
              {editingFaculty ? (
                <>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Employee ID</label>
                    <input type="text" value={editingFaculty.employee_id} onChange={e => setEditingFaculty(p => ({ ...p, employee_id: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Department</label>
                    <select value={editingFaculty.department} onChange={e => setEditingFaculty(p => ({ ...p, department: e.target.value }))}
                      className="input-field py-2 px-3 text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Designation</label>
                    <input type="text" value={editingFaculty.designation} onChange={e => setEditingFaculty(p => ({ ...p, designation: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Full Name</label>
                    <input type="text" value={newFaculty.full_name} onChange={e => setNewFaculty(p => ({ ...p, full_name: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Email</label>
                    <input type="email" value={newFaculty.email} onChange={e => setNewFaculty(p => ({ ...p, email: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Employee ID</label>
                    <input type="text" value={newFaculty.employee_id} onChange={e => setNewFaculty(p => ({ ...p, employee_id: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Department</label>
                    <select value={newFaculty.department} onChange={e => setNewFaculty(p => ({ ...p, department: e.target.value }))}
                      className="input-field py-2 px-3 text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">Designation</label>
                    <input type="text" value={newFaculty.designation} onChange={e => setNewFaculty(p => ({ ...p, designation: e.target.value }))}
                      className="input-field py-2 px-3 text-sm" placeholder="e.g. Assistant Professor, Warden, Accountant" />
                  </div>
                </>
              )}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowFacultyModal(false); setEditingFaculty(null); setModalError(''); }} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-colors">{editingFaculty ? 'Save' : 'Add Faculty'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
