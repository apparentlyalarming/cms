import { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { feeData } from '../../data';

export default function FeeStatus() {
  const [showHistory, setShowHistory] = useState(false);
  const paidPct = Math.round((feeData.paid / feeData.totalFee) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Fee Status</h2>
        <p className="text-surface-400 mt-1">View and manage your fee payments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card animate-slide-up">
          <p className="text-surface-400 text-sm">Total Fee</p>
          <p className="metric-value text-white mt-1">₹{feeData.totalFee.toLocaleString()}</p>
          <p className="text-xs text-surface-500 mt-2">Academic Year 2026-27</p>
        </div>
        <div className="card animate-slide-up" style={{ animationDelay: '80ms' }}>
          <p className="text-surface-400 text-sm">Amount Paid</p>
          <p className="metric-value text-success mt-1">₹{feeData.paid.toLocaleString()}</p>
          <p className="text-xs text-surface-500 mt-2">{paidPct}% complete</p>
        </div>
        <div className="card animate-slide-up" style={{ animationDelay: '160ms' }}>
          <p className="text-surface-400 text-sm">Amount Due</p>
          <p className="metric-value text-danger mt-1">₹{feeData.due.toLocaleString()}</p>
          <p className="text-xs text-warning mt-2">Due by {new Date(feeData.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '240ms' }}>
        <h3 className="section-title">Overall Progress</h3>
        <div className="progress-bar h-4 rounded-full">
          <div
            className="progress-fill bg-gradient-to-r from-success to-emerald-400 h-full"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-success">₹{feeData.paid.toLocaleString()} paid</span>
          <span className="text-danger">₹{feeData.due.toLocaleString()} remaining</span>
        </div>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '320ms' }}>
        <h3 className="section-title">Fee Breakdown</h3>
        <div className="space-y-3">
          {feeData.breakdown.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-700/30">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.paid ? 'bg-success/15' : 'bg-danger/15'
                }`}>
                  {item.paid ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-danger" />
                  )}
                </div>
                <span className="text-sm font-medium text-white">{item.item}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-surface-300">₹{item.amount.toLocaleString()}</span>
                <span className={`badge ${item.paid ? 'badge-success' : 'badge-danger'}`}>
                  {item.paid ? 'Paid' : 'Due'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!feeData.breakdown.every(item => item.paid) && (
          <button className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pay ₹{feeData.due.toLocaleString()} Now
          </button>
        )}
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="section-title mb-0">Payment History</h3>
          {showHistory ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
        </button>

        {showHistory && (
          <div className="mt-4 space-y-3">
            {feeData.history.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.ref}</p>
                    <p className="text-xs text-surface-500">
                      {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">₹{p.amount.toLocaleString()}</p>
                  <span className="badge-success text-[10px]">Paid</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
