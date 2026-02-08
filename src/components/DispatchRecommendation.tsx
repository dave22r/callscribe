import { AlertCircle, Clock, Truck } from 'lucide-react';
import type { EmergencyCall, Ambulance } from '@/data/mockCalls';

interface DispatchRecommendationProps {
  calls: EmergencyCall[];
  ambulances: Ambulance[];
  onSelectCall: (callId: string) => void;
}

export default function DispatchRecommendation({ calls, ambulances, onSelectCall }: DispatchRecommendationProps) {
  // Find highest priority call that needs dispatch
  const urgentCall = calls.find(
    (c) => c.status === 'queued' && c.urgency === 'critical'
  ) || calls.find(
    (c) => c.status === 'queued' && c.urgency === 'urgent'
  );

  if (!urgentCall) {
    return null;
  }

  // Find nearest available ambulance (simplified - in real app would use actual coordinates)
  const availableAmbulances = ambulances.filter(amb => amb.status === 'available');
  const recommendedAmbulance = availableAmbulances.length > 0 ? availableAmbulances[0] : null;

  const formatWaitTime = (timestamp: Date, resolvedAt?: Date) => {
    const endTime = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
    const elapsed = endTime - new Date(timestamp).getTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

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
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
          {recommendedAmbulance && (
            <div className="flex items-center gap-1 mt-1">
              <Truck className="w-3 h-3 text-stable" />
              <span className="text-xs text-stable font-medium">
                Recommend: {recommendedAmbulance.unit}
              </span>
            </div>
          )}
            <span className="text-xs text-muted-foreground">
              Waiting {formatWaitTime(urgentCall.timestamp, urgentCall.resolvedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
