import { useState, useEffect } from 'react';
import {
  LayoutDashboard, GraduationCap, BookOpen, Calendar, CreditCard,
  Building2, CalendarDays, Megaphone, Brain, MessageCircle,
  ChevronLeft, ChevronRight, Sparkles, ScrollText, Shield,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'attendance', icon: BookOpen, label: 'Attendance' },
  { id: 'timetable', icon: Calendar, label: 'Class Timetable' },
  { id: 'exam-timetable', icon: ScrollText, label: 'Exam Timetable' },
  { id: 'fees', icon: CreditCard, label: 'Fee Status' },
  { id: 'hostel', icon: Building2, label: 'Hostel' },
  { id: 'events', icon: CalendarDays, label: 'Events' },
  { id: 'circulars', icon: Megaphone, label: 'Circulars' },
  { id: 'performance', icon: Brain, label: 'AI Performance' },
];

export default function Sidebar({ activeSection, onNavigate, role, user, collapsed, onToggleCollapse, onChatToggle }) {
  const [profile, setProfile] = useState(null);
  const [designation, setDesignation] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
      .then(({ data }) => setProfile(data));
    if (role === 'faculty') {
      supabase.from('faculty').select('designation').eq('faculty_id', user.id).single()
        .then(({ data }) => { if (data) setDesignation(data.designation); });
    }
  }, [user, role]);

  const isAccountant = designation === 'Accountant';
  const isAdmin = designation === 'Admin';
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const visibleItems = isAccountant
    ? navItems.filter(i => ['dashboard', 'fees', 'circulars'].includes(i.id))
    : isAdmin
      ? [...navItems.filter(i => i.id !== 'performance'), { id: 'admin', icon: Shield, label: 'Admin Panel' }]
      : navItems;

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 bg-surface-900/95 backdrop-blur-xl border-r border-surface-700/50 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-surface-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-accent-light" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">CampusAI</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-accent/15 text-accent-light'
                  : 'text-surface-400 hover:text-white hover:bg-surface-700/40'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent-light' : 'text-surface-500 group-hover:text-surface-300'}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-2 space-y-1 border-t border-surface-700/50">
        <button
          onClick={onChatToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-white hover:bg-accent/10 transition-all duration-200 group relative"
          title={collapsed ? 'AI Assistant' : undefined}
        >
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full animate-pulse" />
          <MessageCircle className="w-5 h-5 flex-shrink-0 text-surface-500 group-hover:text-accent-light" />
          {!collapsed && (
            <>
              <span>AI Assistant</span>
              <span className="ml-auto badge-success text-[10px]">ONLINE</span>
            </>
          )}
        </button>
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-800/50 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-surface-500 capitalize">{isAdmin ? 'Admin' : isAccountant ? 'Accountant' : role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
