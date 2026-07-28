import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mb-3">
        <AlertCircle className="w-7 h-7 text-danger" />
      </div>
      <p className="text-sm font-medium text-surface-300">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 btn-ghost text-sm flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}
