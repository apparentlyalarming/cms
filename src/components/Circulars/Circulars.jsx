import { useState, useEffect } from 'react';
import { Download, Eye, ChevronDown, ChevronUp, AlertCircle, Info, AlertTriangle, Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const priorityConfig = {
  high: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/15', label: 'Urgent' },
  medium: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/15', label: 'Important' },
  low: { icon: Info, color: 'text-accent-light', bg: 'bg-accent/15', label: 'Info' },
};

const emptyCircular = { title: '', body: '', category: 'General', priority: 'medium', attachment: '' };

export default function Circulars({ user, role }) {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const isAdmin = designation === 'Admin';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (role === 'faculty' && user) {
          const { data: fac } = await supabase.from('faculty').select('designation').eq('faculty_id', user.id).single();
          if (!cancelled && fac) setDesignation(fac.designation);
        }

        const { data } = await supabase.from('circulars').select('*').order('created_at', { ascending: false });
        if (!cancelled) setCirculars(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, role]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this circular?')) return;
    await supabase.from('circulars').delete().eq('circular_id', id);
    setCirculars(prev => prev.filter(c => c.circular_id !== id));
  };

  const handleSave = async () => {
    const { editing: editId, ...body } = editing;
    if (editId) {
      const { data } = await supabase.from('circulars').update(body).eq('circular_id', editId).select().single();
      if (data) setCirculars(prev => prev.map(c => c.circular_id === editId ? data : c));
    } else {
      const { data } = await supabase.from('circulars').insert(body).select().single();
      if (data) setCirculars(prev => [data, ...prev]);
    }
    setShowModal(false);
    setEditing(null);
  };

  if (loading) return <LoadingState message="Loading circulars..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notice Board</h2>
          <p className="text-surface-400 mt-1">{isAdmin ? 'Manage circulars and announcements' : 'Latest circulars and announcements'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditing({ ...emptyCircular }); setShowModal(true); }}
            className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Circular</button>
        )}
      </div>

      {circulars.length === 0 ? (
        <p className="text-sm text-surface-500 text-center py-10">No circulars posted yet.</p>
      ) : (
        <div className="space-y-3">
          {circulars.map((c, i) => {
            const p = priorityConfig[c.priority] || priorityConfig.low;
            const Icon = p.icon;
            const isExpanded = expandedId === c.circular_id;

            return (
              <div key={c.circular_id} className={`card transition-all duration-300 ${c.priority === 'high' ? 'border-danger/20' : ''} animate-slide-up relative`}
                style={{ animationDelay: `${i * 60}ms` }}>
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    <button onClick={() => { setEditing({ editing: c.circular_id, ...c }); setShowModal(true); }}
                      className="p-1.5 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-400 hover:text-accent-light transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c.circular_id)}
                      className="p-1.5 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-400 hover:text-danger transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button onClick={() => setExpandedId(isExpanded ? null : c.circular_id)} className="w-full text-left">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${p.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${p.bg} ${p.color}`}>{p.label}</span>
                        <span className="badge bg-surface-700/50 text-surface-400">{c.category}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{c.title}</h4>
                      <p className="text-xs text-surface-500 mt-1">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-surface-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-surface-500 flex-shrink-0" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-surface-700/30 animate-fade-in">
                    <p className="text-sm text-surface-300 leading-relaxed">{c.body}</p>
                    {c.attachment && (
                      <div className="mt-4 flex gap-2">
                        <button className="btn-ghost text-sm flex items-center gap-2"><Download className="w-4 h-4" />{c.attachment}</button>
                        <button className="btn-ghost text-sm flex items-center gap-2"><Eye className="w-4 h-4" />Preview</button>
                      </div>
                    )}
                  </div>
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
              <h3 className="text-lg font-semibold text-white">{editing?.editing ? 'Edit Circular' : 'Add Circular'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-surface-400 mb-1">Title</label>
                <input type="text" value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Body</label>
                <textarea value={editing.body} onChange={e => setEditing(p => ({ ...p, body: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" rows={4} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Category</label>
                  <select value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))}
                    className="input-field py-2 px-3 text-sm">
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Exam">Exam</option>
                    <option value="Event">Event</option>
                    <option value="Hostel">Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Priority</label>
                  <select value={editing.priority} onChange={e => setEditing(p => ({ ...p, priority: e.target.value }))}
                    className="input-field py-2 px-3 text-sm">
                    <option value="low">Info</option>
                    <option value="medium">Important</option>
                    <option value="high">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Attachment</label>
                  <input type="text" value={editing.attachment || ''} onChange={e => setEditing(p => ({ ...p, attachment: e.target.value }))}
                    className="input-field py-2 px-3 text-sm" placeholder="URL (optional)" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!editing.title || !editing.body}
                className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
