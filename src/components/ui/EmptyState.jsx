import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data found', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-surface-700/30 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-surface-500" />
      </div>
      <p className="text-sm font-medium text-surface-300">{title}</p>
      {description && <p className="text-xs text-surface-500 mt-1 max-w-xs text-center">{description}</p>}
    </div>
  );
}
