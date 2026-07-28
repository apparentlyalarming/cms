import { useState, useEffect } from 'react';
import { Download, Eye, ChevronDown, ChevronUp, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const priorityConfig = {
  high: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/15', label: 'Urgent' },
  medium: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/15', label: 'Important' },
  low: { icon: Info, color: 'text-accent-light', bg: 'bg-accent/15', label: 'Info' },
};

export default function Circulars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
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
  }, []);

  if (loading) return <LoadingState message="Loading circulars..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Notice Board</h2>
        <p className="text-surface-400 mt-1">Latest circulars and announcements</p>
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
              <div
                key={c.circular_id}
                className={`card transition-all duration-300 ${c.priority === 'high' ? 'border-danger/20' : ''} animate-slide-up`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
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
    </div>
  );
}
