import { Bell, LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getStoredTheme, setStoredTheme, applyTheme } from '../lib/theme';

export default function Header({ role, pageTitle, onLogout }) {
  const [showNotif, setShowNotif] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme());
  const [notifs, setNotifs] = useState([]);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    if (!showNotif) return;
    supabase.from('circulars').select('title, created_at').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setNotifs(data || []));
  }, [showNotif]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setStoredTheme(next);
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-xl border-b border-surface-700/50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
                    {notifs.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-surface-500">No new notifications</div>
                    ) : notifs.map((n, i) => (
                      <div key={i} className="px-4 py-3 hover:bg-surface-700/30 transition-colors border-b border-surface-700/20 last:border-0">
                        <p className="text-sm text-surface-200">{n.title}</p>
                        <p className="text-xs text-surface-500 mt-1">{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</p>
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
