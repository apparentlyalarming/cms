import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import FacultyDashboard from './components/Dashboard/FacultyDashboard';
import AttendanceTracker from './components/Attendance/AttendanceTracker';
import Timetable from './components/Timetable/Timetable';
import FeeStatus from './components/Fee/FeeStatus';
import HostelManagement from './components/Hostel/HostelManagement';
import EventRegistration from './components/Events/EventRegistration';
import Circulars from './components/Circulars/Circulars';
import PerformancePredictor from './components/AI/PerformancePredictor';
import Chatbot from './components/AI/Chatbot';

const sectionTitles = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  timetable: 'Timetable',
  fees: 'Fee Status',
  hostel: 'Hostel Management',
  events: 'Campus Events',
  circulars: 'Notice Board',
  performance: 'AI Performance Predictor',
};

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authPage, setAuthPage] = useState('login');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleLogin = (userRole, user) => {
    setRole(userRole);
    setAuthUser(user);
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    setAuthUser(null);
    setRole(null);
    setActiveSection('dashboard');
    setSidebarCollapsed(false);
    setChatOpen(false);
  };

  useEffect(() => {
    if (!authUser) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.role) {
          const metaRole = authUser.user_metadata?.role;
          if (metaRole) setRole(metaRole);
          return;
        }
        setRole(data.role);
      });
  }, [authUser]);

  if (!authUser) {
    if (authPage === 'signup') {
      return <Signup onSignup={handleLogin} onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthPage('signup')} />;
  }

  const user = authUser;

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return role === 'student'
          ? <StudentDashboard user={user} onNavigate={setActiveSection} />
          : <FacultyDashboard user={user} onNavigate={setActiveSection} />;
      case 'attendance':
        return <AttendanceTracker user={user} />;
      case 'timetable':
        return <Timetable user={user} />;
      case 'fees':
        return <FeeStatus user={user} />;
      case 'hostel':
        return <HostelManagement user={user} />;
      case 'events':
        return <EventRegistration user={user} />;
      case 'circulars':
        return <Circulars />;
      case 'performance':
        return <PerformancePredictor user={user} />;
      default:
        return <StudentDashboard user={user} onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        role={role}
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onChatToggle={() => setChatOpen(!chatOpen)}
      />

      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '256px' }}
      >
        <Header
          role={role}
          pageTitle={sectionTitles[activeSection]}
          onLogout={handleLogout}
        />
        <main className="p-6">
          {renderSection()}
        </main>
      </div>

      <Chatbot isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
}
