import { Brain, AlertTriangle, Heart, User, MapPin, XCircle, Check, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { EmergencyCall, UrgencyLevel, Ambulance } from '@/data/mockCalls';

interface TriagePanelProps {
  call: EmergencyCall | null;
  ambulances: Ambulance[];
  onOverride?: (urgency: UrgencyLevel) => void;
  onDispatch?: (ambulanceId: string) => void;
  onResolve?: () => void;
}

const urgencyDisplay: Record<UrgencyLevel, { label: string; color: string; bg: string; glow: string }> = {
  critical: { label: 'CRITICAL', color: 'text-critical', bg: 'bg-critical/10', glow: 'glow-critical' },
  urgent: { label: 'URGENT', color: 'text-urgent', bg: 'bg-urgent/10', glow: 'glow-urgent' },
  stable: { label: 'STABLE', color: 'text-stable', bg: 'bg-stable/10', glow: 'glow-stable' },
};

const TriagePanel = ({ call, ambulances, onOverride, onDispatch, onResolve }: TriagePanelProps) => {
  const [showOverrideOptions, setShowOverrideOptions] = useState(false);
  const [showAmbulanceOptions, setShowAmbulanceOptions] = useState(false);

  if (!call) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <Brain className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-sm">AI triage will appear here</p>
      </div>
    );
  }

  const urg = urgencyDisplay[call.urgency];

  const handleOverrideClick = (urgency: UrgencyLevel) => {
    onOverride?.(urgency);
    setShowOverrideOptions(false);
  };

  const handleDispatchClick = (ambulanceId: string) => {
    onDispatch?.(ambulanceId);
    setShowAmbulanceOptions(false);
  };

  const availableAmbulances = ambulances.filter(amb => amb.status === 'available');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Triage Assessment
        </h2>
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
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${urg.color}`} />
            <span className={`text-lg font-bold font-mono ${urg.color}`}>{urg.label}</span>
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
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${call.urgency === 'critical' ? 'bg-critical/10 text-critical' :
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
          
          <div className="relative">
            <button 
              onClick={() => setShowOverrideOptions(!showOverrideOptions)}
              disabled={!onOverride}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-3.5 h-3.5" />
              Override Urgency
            </button>
            
            {showOverrideOptions && onOverride && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-md shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => handleOverrideClick('critical')}
                  disabled={call.urgency === 'critical'}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-critical/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-critical" />
                  <span className="font-mono text-critical">CRITICAL</span>
                </button>
                <button
                  onClick={() => handleOverrideClick('urgent')}
                  disabled={call.urgency === 'urgent'}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-urgent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-urgent" />
                  <span className="font-mono text-urgent">URGENT</span>
                </button>
                <button
                  onClick={() => handleOverrideClick('stable')}
                  disabled={call.urgency === 'stable'}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stable/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-stable" />
                  <span className="font-mono text-stable">STABLE</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowAmbulanceOptions(!showAmbulanceOptions)}
              disabled={!onDispatch || availableAmbulances.length === 0}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-critical/20 text-critical text-xs font-medium hover:bg-critical/30 transition-colors border border-critical/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Truck className="w-3.5 h-3.5" />
              Dispatch Ambulance
            </button>
            
            {showAmbulanceOptions && onDispatch && availableAmbulances.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-md shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
                {availableAmbulances.map((amb) => (
                  <button
                    key={amb.id}
                    onClick={() => handleDispatchClick(amb.id)}
                    className="w-full flex flex-col gap-1 px-3 py-2 text-xs hover:bg-accent transition-colors text-left border-b border-border last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold">{amb.unit}</span>
                      <span className="text-stable text-[10px]">AVAILABLE</span>
                    </div>
                    <span className="text-muted-foreground text-[10px]">{amb.crew}</span>
                    <span className="text-muted-foreground text-[10px] truncate">{amb.location}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={onResolve}
            disabled={!onResolve}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-stable/20 text-stable text-xs font-medium hover:bg-stable/30 transition-colors border border-stable/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  );
};

export default TriagePanel;
