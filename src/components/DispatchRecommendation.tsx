import { AlertCircle } from 'lucide-react';
import type { EmergencyCall } from '@/data/mockCalls';

interface DispatchRecommendationProps {
  calls: EmergencyCall[];
  onSelectCall: (callId: string) => void;
}

export default function DispatchRecommendation({ calls, onSelectCall }: DispatchRecommendationProps) {
  // Find highest priority call that needs dispatch
  const urgentCall = calls.find(
    (c) => c.status === 'queued' && c.urgency === 'critical'
  ) || calls.find(
    (c) => c.status === 'queued' && c.urgency === 'urgent'
  );

  if (!urgentCall) {
    return null;
  }

  return (
    <div
      className="px-4 py-3 bg-destructive/10 border-b border-destructive/20 cursor-pointer hover:bg-destructive/15 transition-colors"
      onClick={() => onSelectCall(urgentCall.id)}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-destructive">
            Dispatch Recommended
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {urgentCall.callerName} • {urgentCall.urgency}
          </p>
        </div>
      </div>
    </div>
  );
}
