import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

export default function FeeStatus({ user }) {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const [feesRes, paymentsRes] = await Promise.all([
          supabase.from('fees').select('*').eq('student_id', user.id).order('created_at'),
          supabase.from('fee_payments').select('*').eq('student_id', user.id).order('payment_date', { ascending: false }),
        ]);

        if (!cancelled) {
          setFees(feesRes.data || []);
          setPayments(paymentsRes.data || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <LoadingState message="Loading fee data..." />;
  if (error) return <ErrorState message={error} />;

  const totalFee = fees.reduce((s, f) => s + Number(f.amount), 0);
  const paid = fees.filter(f => f.paid).reduce((s, f) => s + Number(f.amount), 0);
  const due = totalFee - paid;
  const paidPct = totalFee > 0 ? Math.round((paid / totalFee) * 100) : 0;
  const dueDate = fees.find(f => !f.paid)?.due_date;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Fee Status</h2>
        <p className="text-surface-400 mt-1">View and manage your fee payments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card animate-slide-up">
          <p className="text-surface-400 text-sm">Total Fee</p>
          <p className="metric-value text-white mt-1">₹{totalFee.toLocaleString()}</p>
        </div>
        <div className="card animate-slide-up" style={{ animationDelay: '80ms' }}>
          <p className="text-surface-400 text-sm">Amount Paid</p>
          <p className="metric-value text-success mt-1">₹{paid.toLocaleString()}</p>
          <p className="text-xs text-surface-500 mt-2">{paidPct}% complete</p>
        </div>
        <div className="card animate-slide-up" style={{ animationDelay: '160ms' }}>
          <p className="text-surface-400 text-sm">Amount Due</p>
          <p className="metric-value text-danger mt-1">₹{due.toLocaleString()}</p>
          {dueDate && <p className="text-xs text-warning mt-2">Due by {new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
        </div>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '240ms' }}>
        <h3 className="section-title">Fee Breakdown</h3>
        {fees.length === 0 ? (
          <p className="text-sm text-surface-500">No fee records found.</p>
        ) : (
          <div className="space-y-3">
            {fees.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-700/30">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.paid ? 'bg-success/15' : 'bg-danger/15'}`}>
                    {item.paid ? <CheckCircle className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-danger" />}
                  </div>
                  <span className="text-sm font-medium text-white">{item.item_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-300">₹{Number(item.amount).toLocaleString()}</span>
                  <span className={`badge ${item.paid ? 'badge-success' : 'badge-danger'}`}>{item.paid ? 'Paid' : 'Due'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {due > 0 && <button className="btn-primary w-full mt-4 flex items-center justify-center gap-2"><CreditCard className="w-4 h-4" />Pay ₹{due.toLocaleString()} Now</button>}
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '320ms' }}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between">
          <h3 className="section-title mb-0">Payment History</h3>
          {showHistory ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
        </button>
        {showHistory && (
          <div className="mt-4 space-y-3">
            {payments.length === 0 ? (
              <p className="text-sm text-surface-500">No payment history.</p>
            ) : payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.ref_number}</p>
                    <p className="text-xs text-surface-500">{new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-success">₹{Number(p.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
