import { Brain, AlertTriangle, Heart, User, MapPin, CheckCircle, XCircle, Truck, Clock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { translateLines } from '@/lib/translate';
import type { EmergencyCall, UrgencyLevel } from '@/data/mockCalls';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getWaitTimeLabel } from '@/lib/dispatchRecommendation';

interface TriagePanelProps {
  call: EmergencyCall | null;
  onAccept?: () => void;
  onOverride?: (urgency: UrgencyLevel) => void;
  onDispatch?: () => void;
}

const urgencyDisplay: Record<UrgencyLevel, { label: string; color: string; bg: string; glow: string }> = {
  critical: { label: 'CRITICAL', color: 'text-critical', bg: 'bg-critical/10', glow: 'glow-critical' },
  urgent: { label: 'URGENT', color: 'text-urgent', bg: 'bg-urgent/10', glow: 'glow-urgent' },
  stable: { label: 'STABLE', color: 'text-stable', bg: 'bg-stable/10', glow: 'glow-stable' },
};

// Mock translations for demo
const mockTranslations: Record<string, string> = {
  // Patient types
  'Adulto (45M)': 'Adult (45M)',
  'Hombre adulto, 45 años': 'Adult male, 45 years old',
  
  // Symptoms
  'dolor en el pecho': 'chest pain',
  'dificultad para respirar': 'difficulty breathing',
  'sudoración': 'sweating',
  'débil': 'weak',
  'mareado': 'dizzy',
  
  // Summaries
  'Paciente con dolor en el pecho y dificultad para respirar.': 'Patient with chest pain and difficulty breathing.',
  'El paciente informa dolor intenso en el pecho con irradiación al brazo izquierdo, sudoración profusa y dificultad respiratoria. Antecedentes de hipertensión. Posible evento cardíaco agudo.': 'Patient reports severe chest pain radiating to left arm, profuse sweating, and difficulty breathing. History of hypertension. Possible acute cardiac event.',
  'Paciente reporta caída desde escalera, posible fractura de muñeca, consciente y orientado.': 'Patient reports fall from ladder, possible wrist fracture, conscious and alert.',
};

const TriagePanel = ({ call, onAccept, onOverride, onDispatch }: TriagePanelProps) => {
  const [showTranslation, setShowTranslation] = useState(false);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Triage Assessment
            </h2>
          </div>
          <button
            className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1 hover:bg-primary/20"
            onClick={() => setShowTranslation(!showTranslation)}
          >
            <Globe className="w-3 h-3" />
            {showTranslation ? 'Hide' : 'Show'} Translation
          </button>
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
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${urg.color}`} />
            <span className={`text-lg font-bold font-mono ${urg.color}`}>{urg.label}</span>
          </div>
        </motion.div>

        {/* Wait Time */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono uppercase">Time Waiting</span>
          </div>
          <div className="pl-5">
            <p className="text-sm font-medium">{getWaitTimeLabel(call)}</p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono uppercase">Patient</span>
          </div>
          <div className="pl-5">
            <p className="text-sm font-medium">{call.patientType}</p>
            {showTranslation && mockTranslations[call.patientType] && (
              <p className="text-xs text-muted-foreground italic mt-1">
                🌐 {mockTranslations[call.patientType]}
              </p>
            )}
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
          <div className="pl-5 space-y-2">
            <div className="flex flex-wrap gap-1.5">
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
            {showTranslation && (
              <div className="flex flex-wrap gap-1.5">
                {call.symptoms.map((symptom) => mockTranslations[symptom] && (
                  <span
                    key={symptom}
                    className="text-[10px] text-muted-foreground italic"
                  >
                    🌐 {mockTranslations[symptom]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1.5">AI Summary</p>
          <p className="text-sm leading-relaxed text-secondary-foreground">{call.summary}</p>
          {showTranslation && mockTranslations[call.summary] && (
            <p className="text-xs text-muted-foreground italic mt-2">
              🌐 {mockTranslations[call.summary]}
            </p>
          )}
        </div>

        {/* Dispatcher Actions */}
        <div className="pt-2 space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase">Dispatcher Actions</p>
          <div className="flex flex-wrap gap-2">
            {onAccept && call.status !== 'queued' && call.status !== 'dispatched' && (
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={onAccept}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Accept
              </Button>
            )}
            {onOverride && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Override urgency
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onOverride('critical')}>
                    Critical
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOverride('urgent')}>
                    Urgent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOverride('stable')}>
                    Stable
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onDispatch && call.status === 'queued' && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={onDispatch}
              >
                <Truck className="w-3.5 h-3.5" />
                Dispatch
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriagePanel;
