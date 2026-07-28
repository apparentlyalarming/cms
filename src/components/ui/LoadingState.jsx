import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
      <p className="text-sm text-surface-400">{message}</p>
    </div>
  );
}
