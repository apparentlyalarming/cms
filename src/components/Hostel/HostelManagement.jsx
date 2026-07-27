import { Building2, Wifi, UtensilsCrossed, Dumbbell, BookOpen, Shirt, CheckCircle, Clock, XCircle, User } from 'lucide-react';
import { hostelData } from '../../data';

const amenityIcons = { 'Wi-Fi': Wifi, 'Laundry': Shirt, 'Common Room': UtensilsCrossed, 'Gym': Dumbbell, 'Study Hall': BookOpen };

const statusStyles = {
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/15', label: 'Approved' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/15', label: 'Pending' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/15', label: 'Rejected' },
};

export default function HostelManagement() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Hostel Management</h2>
        <p className="text-surface-400 mt-1">Room details, passes, and amenities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent-light" />
            </div>
            <h3 className="font-semibold text-white">Room Details</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Room Number', value: hostelData.roomNumber },
              { label: 'Block', value: hostelData.block },
              { label: 'Room Type', value: hostelData.roomType },
              { label: 'Warden', value: hostelData.warden },
            ].map((d, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-sm text-surface-400">{d.label}</span>
                <span className="text-sm font-medium text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h3 className="font-semibold text-white mb-4">Mess Timings</h3>
          <div className="space-y-2">
            {hostelData.messTimings.split(' | ').map((t, i) => {
              const [meal, time] = t.split(': ');
              return (
                <div key={i} className="p-3 rounded-xl bg-surface-700/30">
                  <p className="text-sm font-medium text-accent-light">{meal}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{time}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h3 className="font-semibold text-white mb-4">Amenities</h3>
          <div className="grid grid-cols-2 gap-2">
            {hostelData.amenities.map((a, i) => {
              const Icon = amenityIcons[a] || Building2;
              return (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-700/30">
                  <Icon className="w-4 h-4 text-accent-light" />
                  <span className="text-sm text-surface-200">{a}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">Pass Requests</h3>
          <button className="btn-primary text-sm">+ New Request</button>
        </div>
        <div className="space-y-3">
          {hostelData.passRequests.map((p) => {
            const s = statusStyles[p.status];
            const Icon = s.icon;
            return (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-700/30 hover:bg-surface-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.type}</p>
                    <p className="text-xs text-surface-500">
                      Date: {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
