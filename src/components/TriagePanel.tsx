import { Brain, AlertTriangle, Heart, User, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EmergencyCall, UrgencyLevel } from '@/data/mockCalls';

interface TriagePanelProps {
  call: EmergencyCall | null;
}

const urgencyDisplay: Record<UrgencyLevel, { label: string; color: string; bg: string; glow: string }> = {
  critical: { label: 'CRITICAL', color: 'text-critical', bg: 'bg-critical/10', glow: 'glow-critical' },
  urgent: { label: 'URGENT', color: 'text-urgent', bg: 'bg-urgent/10', glow: 'glow-urgent' },
  stable: { label: 'STABLE', color: 'text-stable', bg: 'bg-stable/10', glow: 'glow-stable' },
};

const TriagePanel = ({ call }: TriagePanelProps) => {
  if (!call) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <Brain className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-sm">AI triage will appear here</p>
      </div>
    );
  }

  const urg = urgencyDisplay[call.urgency];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI Triage Assessment
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Urgency Level */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-lg border p-4 ${urg.bg} ${urg.glow} border-transparent`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Urgency Classification</span>
            <span className="text-[10px] font-mono text-muted-foreground">{call.confidence}% confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${urg.color}`} />
            <span className={`text-lg font-bold font-mono ${urg.color}`}>{urg.label}</span>
          </div>
          {/* Confidence bar */}
          <div className="mt-3 h-1.5 bg-background/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${call.confidence}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                call.urgency === 'critical' ? 'bg-critical' :
                call.urgency === 'urgent' ? 'bg-urgent' : 'bg-stable'
              }`}
            />
          </div>
        </motion.div>

        {/* Patient Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono uppercase">Patient</span>
          </div>
          <div className="pl-5">
            <p className="text-sm font-medium">{call.patientType}</p>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono uppercase">Location</span>
          </div>
          <div className="pl-5">
            <p className="text-sm">{call.location}</p>
          </div>
        </div>

        {/* Detected Symptoms */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono uppercase">Detected Symptoms</span>
          </div>
          <div className="pl-5 flex flex-wrap gap-1.5">
            {call.symptoms.map((symptom) => (
              <span
                key={symptom}
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                  call.urgency === 'critical' ? 'bg-critical/10 text-critical' :
                  call.urgency === 'urgent' ? 'bg-urgent/10 text-urgent' : 'bg-stable/10 text-stable'
                }`}
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1.5">AI Summary</p>
          <p className="text-sm leading-relaxed text-secondary-foreground">{call.summary}</p>
        </div>

        {/* Dispatcher Actions */}
        <div className="pt-2 space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase">Dispatcher Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              <CheckCircle className="w-3.5 h-3.5" />
              Accept
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors border border-border">
              <XCircle className="w-3.5 h-3.5" />
              Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriagePanel;
