import { Truck, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  getRecommendedDispatch,
  getWaitTimeLabel,
} from '@/lib/dispatchRecommendation';
import type { EmergencyCall } from '@/data/mockCalls';

const urgencyConfig: Record<string, { label: string; class: string }> = {
  critical: { label: 'CRITICAL', class: 'text-critical' },
  urgent: { label: 'URGENT', class: 'text-urgent' },
  stable: { label: 'STABLE', class: 'text-stable' },
};

interface DispatchRecommendationProps {
  calls: EmergencyCall[];
  onSelectCall: (id: string) => void;
}

const DispatchRecommendation = ({ calls, onSelectCall }: DispatchRecommendationProps) => {
  const recommended = getRecommendedDispatch(calls);

  if (!recommended) {
    return (
      <div className="px-4 py-3 border-b border-border bg-accent/20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="w-4 h-4" />
          <span className="text-xs font-medium">No queued calls</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Accept or save calls to see dispatch recommendations
        </p>
      </div>
    );
  }

  const urg = urgencyConfig[recommended.urgency] ?? urgencyConfig.stable;
  const waitLabel = getWaitTimeLabel(recommended);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3 border-b border-border bg-primary/5"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Truck className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Recommended to dispatch
        </span>
      </div>
      <div className="rounded-lg border border-border bg-background p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{recommended.callerName}</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {recommended.location || 'Unknown location'}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-mono font-semibold ${urg.class}`}>
                {urg.label}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {waitLabel} wait
              </span>
              <span className="text-[10px] text-muted-foreground">
                {recommended.confidence}% confidence
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="default"
            className="shrink-0 gap-1"
            onClick={() => onSelectCall(recommended.id)}
          >
            <AlertTriangle className="w-3 h-3" />
            View
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DispatchRecommendation;
