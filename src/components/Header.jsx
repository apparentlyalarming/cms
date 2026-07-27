import { Bell, LogOut } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Header({ role, onRoleToggle, pageTitle, onLogout }) {
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-xl border-b border-surface-700/50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRoleToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/60 border border-surface-700/50 hover:border-accent/30 transition-all duration-200 group"
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${role === 'student' ? 'bg-accent' : 'bg-purple-400'}`} />
            <span className="text-sm font-medium text-surface-300 group-hover:text-white transition-colors">
              {role === 'student' ? 'Student Dashboard' : 'Faculty Dashboard'}
            </span>
            <div className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-semibold">
              {role === 'student' ? 'S' : 'F'}
            </div>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 rounded-xl hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
            </button>

            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface-800 border border-surface-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-surface-700/50">
                    <h3 className="font-semibold text-white text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {[
                      { text: 'Mid-sem exam schedule is out!', time: '2h ago' },
                      { text: 'Fee payment reminder: Due Aug 15', time: '1d ago' },
                      { text: 'TechFest registration confirmed', time: '3d ago' },
                    ].map((n, i) => (
                      <div key={i} className="px-4 py-3 hover:bg-surface-700/30 transition-colors border-b border-surface-700/20 last:border-0">
                        <p className="text-sm text-surface-200">{n.text}</p>
                        <p className="text-xs text-surface-500 mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-6 bg-surface-700/50" />

          <button
            onClick={async () => { await supabase.auth.signOut(); onLogout?.(); }}
            className="p-2 rounded-xl hover:bg-danger/10 text-surface-400 hover:text-danger transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
