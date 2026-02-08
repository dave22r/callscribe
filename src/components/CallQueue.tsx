import { Phone, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EmergencyCall, UrgencyLevel } from '@/data/mockCalls';

interface CallQueueProps {
  calls: EmergencyCall[];
  selectedCallId: string | null;
  onSelectCall: (id: string) => void;
}

const urgencyConfig: Record<UrgencyLevel, { label: string; class: string; dotClass: string; bgClass: string }> = {
  critical: { label: 'CRITICAL', class: 'text-critical', dotClass: 'bg-critical', bgClass: 'bg-critical/5 border-critical/20' },
  urgent: { label: 'URGENT', class: 'text-urgent', dotClass: 'bg-urgent', bgClass: 'bg-urgent/5 border-urgent/20' },
  stable: { label: 'STABLE', class: 'text-stable', dotClass: 'bg-stable', bgClass: 'bg-stable/5 border-stable/20' },
};

const statusLabels: Record<string, string> = {
  active: 'LIVE',
  queued: 'QUEUED',
  dispatched: 'DISPATCHED',
  resolved: 'RESOLVED',
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatWaitTime = (timestamp: Date) => {
  const now = new Date();
  const waitSeconds = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);
  const minutes = Math.floor(waitSeconds / 60);
  const seconds = waitSeconds % 60;
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

const CallQueue = ({ calls, selectedCallId, onSelectCall }: CallQueueProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Call Queue
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
            {calls.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {calls.map((call, index) => {
          const urg = urgencyConfig[call.urgency];
          const isSelected = call.id === selectedCallId;

          return (
            <motion.button
              key={call.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectCall(call.id)}
              className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                isSelected ? 'bg-accent/60' : 'hover:bg-accent/30'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${urg.dotClass} ${call.urgency === 'critical' ? 'animate-pulse-critical' : ''}`} />
                  <span className={`text-[10px] font-mono font-semibold ${urg.class}`}>
                    {urg.label}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  call.status === 'active' ? 'bg-critical/10 text-critical' : 'bg-muted text-muted-foreground'
                }`}>
                  {statusLabels[call.status]}
                </span>
              </div>

              <p className="text-sm font-medium text-foreground truncate">{call.callerName}</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{call.location}</p>

              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-mono">{formatWaitTime(call.timestamp)}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CallQueue;
