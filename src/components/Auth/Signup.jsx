import { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, User, GraduationCap, BookOpen,
  AlertCircle, Loader2, ArrowRight, Hash, Building2, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const departments = [
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Chemical Engineering',
  'Biotechnology',
];

export default function Signup({ onSignup, onSwitchToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = fullName && email && password && department && (role === 'faculty' ? employeeId : rollNumber);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        setError('Account created. Check your email to confirm before signing in.');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      if (role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            student_id: userId,
            roll_number: rollNumber,
            department,
            semester: 1,
          });

        if (studentError) throw studentError;
      } else {
        const { error: facultyError } = await supabase
          .from('faculty')
          .insert({
            faculty_id: userId,
            employee_id: employeeId,
            department,
            designation: 'Assistant Professor',
          });

        if (facultyError) throw facultyError;
      }

      onSignup(role, authData.user);
    } catch (err) {
      const messages = {
        'User already registered': 'An account with this email already exists.',
        'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
        'Signup requires a valid password': 'Please enter a valid password.',
      };
      setError(messages[err.message] || err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-500 shadow-xl shadow-accent/20 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-surface-400 mt-2">Join the Smart Campus Portal</p>
        </div>

        <div className="bg-surface-800/40 backdrop-blur-xl border border-surface-700/50 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-danger font-medium">Signup Failed</p>
                <p className="text-xs text-danger/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Arjun Mehta"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="you@campus.edu"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'student', label: 'Student', icon: BookOpen },
                  { value: 'faculty', label: 'Faculty', icon: Building2 },
                ].map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        role === r.value
                          ? 'bg-accent/15 border-accent/40 text-accent-light'
                          : 'bg-surface-700/30 border-surface-700/30 text-surface-400 hover:text-white hover:border-surface-600/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input-field pl-11 pr-10 appearance-none"
                  required
                >
                  <option value="" disabled>Select department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
              </div>
            </div>

            {role === 'student' && (
              <div className="animate-slide-up">
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Roll Number</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="input-field pl-11"
                    placeholder="CS2026-001"
                    required={role === 'student'}
                  />
                </div>
              </div>
            )}

            {role === 'faculty' && (
              <div className="animate-slide-up">
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Employee ID</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="input-field pl-11"
                    placeholder="FAC2024-001"
                    required={role === 'faculty'}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-accent-light hover:text-accent font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-surface-600 mt-6">
          Smart Campus Management Portal &middot; Secure Authentication via Supabase
        </p>
      </div>
    </div>
  );
}
