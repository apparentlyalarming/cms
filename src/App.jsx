import { useState } from 'react';
import Login from './components/Auth/Login';
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

  const toggleRole = () => {
    setRole(prev => prev === 'student' ? 'faculty' : 'student');
    setActiveSection('dashboard');
  };

  if (!authUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return role === 'student'
          ? <StudentDashboard onNavigate={setActiveSection} />
          : <FacultyDashboard onNavigate={setActiveSection} />;
      case 'attendance':
        return <AttendanceTracker />;
      case 'timetable':
        return <Timetable />;
      case 'fees':
        return <FeeStatus />;
      case 'hostel':
        return <HostelManagement />;
      case 'events':
        return <EventRegistration />;
      case 'circulars':
        return <Circulars />;
      case 'performance':
        return <PerformancePredictor />;
      default:
        return <StudentDashboard onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        role={role}
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
          onRoleToggle={toggleRole}
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
