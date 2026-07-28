import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, GraduationCap, Loader2, ArrowRight, UserPlus, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getStoredTheme, setStoredTheme, applyTheme } from '../../lib/theme';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function Login({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme());
  const [showActivate, setShowActivate] = useState(false);

  useEffect(() => { applyTheme(theme); }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => { const next = prev === 'dark' ? 'light' : 'dark'; setStoredTheme(next); return next; });
  };
  const [activateName, setActivateName] = useState('');
  const [activateEmail, setActivateEmail] = useState('');
  const [activatePwd, setActivatePwd] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateMsg, setActivateMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('Profile fetch failed, defaulting to student role:', profileError.message);
        onLogin('student', authData.user);
        return;
      }

      const userRole = profile.role || 'student';
      onLogin(userRole, authData.user);
    } catch (err) {
      const messages = {
        'Invalid login credentials': 'Invalid email or password. Please check your credentials.',
        'Email not confirmed': 'Please verify your email address before signing in.',
        'Too many requests': 'Too many login attempts. Please try again later.',
      };
      setError(messages[err.message] || err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setActivateMsg('');
    setActivating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: activateEmail,
        password: activatePwd,
        options: { data: { full_name: activateName, role: 'student' } },
      });

      if (error) throw error;
      setActivateMsg(data?.user
        ? 'Account activated! You can now sign in.'
        : 'Check your email to confirm before signing in.');
    } catch (err) {
      setActivateMsg(err.message);
    } finally {
      setActivating(false);
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
        <button onClick={toggleTheme} className="absolute -top-2 -right-2 p-2 rounded-xl hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-500 shadow-xl shadow-accent/20 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CampusAI Portal</h1>
          <p className="text-surface-400 mt-2">Sign in to access your dashboard</p>
        </div>

        <div className="bg-surface-800/40 backdrop-blur-xl border border-surface-700/50 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-danger font-medium">Login Failed</p>
                <p className="text-xs text-danger/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Email Address</label>
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-300">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-accent-light hover:text-accent font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-700/30">
            <div className="flex items-center gap-3 text-xs text-surface-500">
              <div className="flex-1 h-px bg-surface-700/30" />
              <span>Demo Credentials</span>
              <div className="flex-1 h-px bg-surface-700/30" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('albinsunny@gmail.com'); setPassword('@student123'); }}
                className="p-2.5 rounded-xl bg-surface-700/30 hover:bg-surface-700/50 border border-surface-700/30 transition-all text-center group"
              >
                <p className="text-xs font-medium text-surface-300 group-hover:text-white">Student</p>
                <p className="text-[10px] text-surface-500 mt-0.5">albinsunny@gmail.com</p>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('apparentlyalarming@gmail.com'); setPassword('@faculty123'); }}
                className="p-2.5 rounded-xl bg-surface-700/30 hover:bg-surface-700/50 border border-surface-700/30 transition-all text-center group"
              >
                <p className="text-xs font-medium text-surface-300 group-hover:text-white">Faculty</p>
                <p className="text-[10px] text-surface-500 mt-0.5">apparentlyalarming@gmail.com</p>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <button type="button" onClick={() => setShowActivate(!showActivate)}
              className="w-full flex items-center justify-center gap-2 text-xs text-surface-500 hover:text-surface-300 transition-colors py-2">
              <UserPlus className="w-3.5 h-3.5" />
              First time signing in? Activate your account
              {showActivate ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showActivate && (
              <form onSubmit={handleActivate} className="mt-3 p-4 rounded-xl bg-surface-700/30 border border-surface-700/30 space-y-3">
                <p className="text-xs text-surface-400">Enter your pre-assigned email to activate your account.</p>
                {activateMsg && (
                  <p className={`text-xs ${activateMsg.includes('Error') || activateMsg.includes('error') ? 'text-danger' : 'text-success'} font-medium`}>
                    {activateMsg}
                  </p>
                )}
                <input type="text" value={activateName} onChange={e => setActivateName(e.target.value)}
                  className="input-field py-2 px-3 text-sm" placeholder="Full Name" required />
                <input type="email" value={activateEmail} onChange={e => setActivateEmail(e.target.value)}
                  className="input-field py-2 px-3 text-sm" placeholder="Pre-assigned email" required />
                <input type="password" value={activatePwd} onChange={e => setActivatePwd(e.target.value)}
                  className="input-field py-2 px-3 text-sm" placeholder="Set a password" required minLength={6} />
                <button type="submit" disabled={activating || !activateName || !activateEmail || !activatePwd}
                  className="w-full py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-medium transition-colors disabled:opacity-50">
                  {activating ? 'Activating...' : 'Activate Account'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-surface-600 mt-6">
          Smart Campus Management Portal &middot; Secure Authentication via Supabase
        </p>

        <p className="text-center text-sm text-surface-400 mt-4">
          Don&apos;t have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-accent-light hover:text-accent font-medium transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>

      <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
    </div>
  );
}
