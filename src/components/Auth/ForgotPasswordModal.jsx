import { useState } from 'react';
import { X, Mail, Lock, ArrowLeft, CheckCircle, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const resetState = () => {
    setStep(1);
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowNewPw(false);
    setShowConfirmPw(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess('Password reset link sent! Check your email inbox. After clicking the link, come back here to set your new password.');
      setTimeout(() => setStep(2), 2000);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setSuccess('Password updated successfully! You can now sign in with your new password.');
      setTimeout(() => handleClose(), 2500);
    } catch (err) {
      const messages = {
        'New password should be different from the old password.': 'Your new password must be different from the previous one.',
        'Auth session missing': 'Your reset session has expired. Please request a new reset link.',
      };
      setError(messages[err.message] || err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-surface-950/80 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-800/90 backdrop-blur-xl border border-surface-700/50 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          <div className="relative p-6 pb-4 border-b border-surface-700/30">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                  className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {step === 1 ? 'Reset Password' : 'Set New Password'}
                </h3>
                <p className="text-xs text-surface-500">
                  {step === 1 ? 'Enter your email to receive a reset link' : 'Choose a strong new password'}
                </p>
              </div>
            </div>

            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-accent to-purple-500 transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-2.5 animate-slide-up">
                <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-5 p-3 rounded-xl bg-success/10 border border-success/20 flex items-start gap-2.5 animate-slide-up">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-success">{success}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendReset} className="space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white">1</div>
                    <span className="text-sm font-medium text-white">Send Reset Link</span>
                  </div>
                  <div className="flex-1 h-px bg-surface-700/30" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-700/50 flex items-center justify-center text-[10px] font-medium text-surface-500">2</div>
                    <span className="text-sm text-surface-500">Set Password</span>
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
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-success">Link Sent</span>
                  </div>
                  <div className="flex-1 h-px bg-surface-700/30" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white">2</div>
                    <span className="text-sm font-medium text-white">Set Password</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pl-11 pr-11"
                      placeholder="Min 6 characters"
                      required
                      autoFocus
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors text-xs"
                    >
                      {showNewPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-11 pr-11"
                      placeholder="Re-enter password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors text-xs"
                    >
                      {showConfirmPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-danger mt-1.5">Passwords do not match</p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-surface-900/40 border border-surface-700/30">
                  <p className="text-xs text-surface-500">
                    <span className="text-surface-400 font-medium">Tip:</span> Use a mix of letters, numbers, and symbols for a stronger password.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
