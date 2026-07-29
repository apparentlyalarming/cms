import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Receipt, Plus, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

export default function FeeStatus({ user, role }) {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [designation, setDesignation] = useState(null);
  const [acctTab, setAcctTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [newFee, setNewFee] = useState({ item_name: '', amount: '' });

  const isAccountant = designation === 'Accountant' || designation === 'Admin';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        if (role === 'faculty') {
          const { data: fac } = await supabase.from('faculty').select('designation').eq('faculty_id', user.id).single();
          if (!cancelled && fac) setDesignation(fac.designation);
        }

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
  }, [user, role]);

  useEffect(() => {
    if (!isAccountant) return;
    supabase.from('students').select('student_id, roll_number, profiles!inner(full_name, email)').limit(100)
      .then(({ data }) => setStudents(data || []));
  }, [isAccountant]);

  const loadStudentFees = async (studentId) => {
    setSelectedStudent(studentId);
    const [feeRes, payRes] = await Promise.all([
      supabase.from('fees').select('*').eq('student_id', studentId).order('created_at'),
      supabase.from('fee_payments').select('*').eq('student_id', studentId).order('payment_date', { ascending: false }),
    ]);
    setStudentFees(feeRes.data || []);
    setStudentPayments(payRes.data || []);
  };

  const addFee = async () => {
    if (!selectedStudent || !newFee.item_name || !newFee.amount) return;
    await supabase.from('fees').insert({
      student_id: selectedStudent, item_name: newFee.item_name,
      amount: parseFloat(newFee.amount), paid: false,
    });
    setStudentFees(prev => [...prev, { ...newFee, amount: parseFloat(newFee.amount), paid: false, student_id: selectedStudent }]);
    setShowFeeModal(false);
    setNewFee({ item_name: '', amount: '' });
  };

  const togglePaid = async (feeId, current) => {
    await supabase.from('fees').update({ paid: !current }).eq('fee_id', feeId);
    setStudentFees(prev => prev.map(f => f.fee_id === feeId ? { ...f, paid: !current } : f));
  };

  if (loading) return <LoadingState message="Loading fee data..." />;
  if (error) return <ErrorState message={error} />;

  const totalFee = fees.reduce((s, f) => s + Number(f.amount), 0);
  const paid = fees.filter(f => f.paid).reduce((s, f) => s + Number(f.amount), 0);
  const due = totalFee - paid;

  const sTotal = studentFees.reduce((s, f) => s + Number(f.amount), 0);
  const sPaid = studentFees.filter(f => f.paid).reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{isAccountant ? 'Accounts Management' : 'Fee Status'}</h2>
          <p className="text-surface-400 mt-1">{isAccountant ? 'Manage student fees and payments' : 'View and manage your fee payments'}</p>
        </div>
      </div>

      {isAccountant && (
        <div className="flex gap-2">
          <button onClick={() => setAcctTab('overview')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${acctTab === 'overview' ? 'bg-accent text-white' : 'bg-surface-800/60 text-surface-400 hover:text-white'}`}>
            My Fees
          </button>
          <button onClick={() => setAcctTab('students')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${acctTab === 'students' ? 'bg-accent text-white' : 'bg-surface-800/60 text-surface-400 hover:text-white'}`}>
            <Users className="w-4 h-4 inline mr-1.5" />Student Fees
          </button>
        </div>
      )}

      {isAccountant && acctTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-white mb-3">Students</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {students.map(s => (
                <button key={s.student_id} onClick={() => loadStudentFees(s.student_id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    selectedStudent === s.student_id ? 'bg-accent/15 text-accent-light' : 'text-surface-300 hover:bg-surface-700/50'
                  }`}>
                  {s.profiles?.full_name || 'Unknown'} · {s.roll_number}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Fee Details</h3>
              {selectedStudent && (
                <button onClick={() => setShowFeeModal(true)}
                  className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Add Fee</button>
              )}
            </div>
            {!selectedStudent ? (
              <p className="text-sm text-surface-500">Select a student to view fees.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded-lg bg-surface-700/30">
                    <p className="text-surface-400 text-xs">Total</p>
                    <p className="text-white font-semibold">₹{sTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-700/30">
                    <p className="text-surface-400 text-xs">Paid</p>
                    <p className="text-success font-semibold">₹{sPaid.toLocaleString()}</p>
                  </div>
                </div>
                {studentFees.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-700/30">
                    <div>
                      <p className="text-sm font-medium text-white">{f.item_name}</p>
                      <p className="text-xs text-surface-500">₹{Number(f.amount).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${f.paid ? 'badge-success' : 'badge-danger'}`}>{f.paid ? 'Paid' : 'Due'}</span>
                      <button onClick={() => togglePaid(f.fee_id, f.paid)}
                        className={`p-1 rounded-lg transition-colors ${f.paid ? 'text-surface-500 hover:text-warning' : 'text-accent-light hover:text-success'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {(!isAccountant || acctTab === 'overview') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card animate-slide-up">
              <p className="text-surface-400 text-sm">Total Fee</p>
              <p className="metric-value text-white mt-1">₹{totalFee.toLocaleString()}</p>
            </div>
            <div className="card animate-slide-up" style={{ animationDelay: '80ms' }}>
              <p className="text-surface-400 text-sm">Amount Paid</p>
              <p className="metric-value text-success mt-1">₹{paid.toLocaleString()}</p>
              <p className="text-xs text-surface-500 mt-2">{totalFee > 0 ? Math.round(paid / totalFee * 100) : 0}% complete</p>
            </div>
            <div className="card animate-slide-up" style={{ animationDelay: '160ms' }}>
              <p className="text-surface-400 text-sm">Amount Due</p>
              <p className="metric-value text-danger mt-1">₹{due.toLocaleString()}</p>
              {fees.find(f => !f.paid)?.due_date && (
                <p className="text-xs text-warning mt-2">Due by {new Date(fees.find(f => !f.paid).due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              )}
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
            {!isAccountant && due > 0 && <button className="btn-primary w-full mt-4 flex items-center justify-center gap-2"><CreditCard className="w-4 h-4" />Pay ₹{due.toLocaleString()} Now</button>}
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
        </>
      )}

      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-surface-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Fee Item</h3>
              <button onClick={() => setShowFeeModal(false)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-surface-400 mb-1">Item Name</label>
                <input type="text" value={newFee.item_name} onChange={e => setNewFee(p => ({ ...p, item_name: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" placeholder="e.g. Tuition Fee" />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Amount (₹)</label>
                <input type="number" min="0" value={newFee.amount} onChange={e => setNewFee(p => ({ ...p, amount: e.target.value }))}
                  className="input-field py-2 px-3 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowFeeModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-300 font-medium transition-colors">Cancel</button>
              <button onClick={addFee} disabled={!newFee.item_name || !newFee.amount}
                className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-50">Add Fee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
