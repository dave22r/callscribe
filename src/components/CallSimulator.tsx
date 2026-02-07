import { Phone, PhoneOff, Mic, MicOff, Volume2, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallSimulator } from '@/hooks/useCallSimulator';
import { Button } from '@/components/ui/button';
import type { EmergencyCall } from '@/data/mockCalls';

interface CallSimulatorProps {
  onCallUpdate?: (call: Partial<EmergencyCall> & { id: string }) => void;
}

const CallSimulator = ({ onCallUpdate }: CallSimulatorProps) => {
  const { state, scribe, startSimulation, stopSimulation } = useCallSimulator();

  // Push updates to the dashboard whenever analysis changes
  const handleStart = async () => {
    await startSimulation();
  };

  // Sync state to parent dashboard
  if (state.callId && onCallUpdate) {
    const callData: Partial<EmergencyCall> & { id: string } = {
      id: state.callId,
      callerName: 'Live Caller',
      phone: 'Simulator',
      location: 'Location pending...',
      status: state.isActive ? 'active' : 'queued',
      transcript: state.transcript,
      urgency: state.analysis?.urgency || 'urgent',
      confidence: state.analysis?.confidence || 0,
      symptoms: state.analysis?.symptoms || [],
      patientType: state.analysis?.patientType || 'Unknown',
      summary: state.analysis?.summary || 'Call in progress...',
      timestamp: new Date(),
      duration: 0,
    };
    // We'll trigger this via useEffect in the parent
    onCallUpdate(callData);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Call Simulator
          </h2>
          {state.isActive && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-critical/10">
              <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse-critical" />
              <span className="text-[10px] font-mono text-critical font-medium">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Call Controls */}
        <div className="flex flex-col items-center gap-3">
          {!state.isActive ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                onClick={handleStart}
                className="w-16 h-16 rounded-full bg-stable/20 border-2 border-stable text-stable hover:bg-stable/30 transition-all flex items-center justify-center hover:scale-105 active:scale-95"
              >
                <Phone className="w-6 h-6" />
              </button>
              <span className="text-xs text-muted-foreground font-medium">Start Emergency Call</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                onClick={stopSimulation}
                className="w-16 h-16 rounded-full bg-critical/20 border-2 border-critical text-critical hover:bg-critical/30 transition-all flex items-center justify-center hover:scale-105 active:scale-95 glow-critical"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-xs text-critical font-medium">End Call</span>
            </motion.div>
          )}
        </div>

        {/* Status indicators */}
        {state.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50">
              {scribe.isConnected ? (
                <Mic className="w-3.5 h-3.5 text-stable" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-[11px] font-mono text-muted-foreground">
                {scribe.isConnected ? 'Microphone active' : 'Connecting mic...'}
              </span>
            </div>

            {state.isAiSpeaking && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10">
                <Volume2 className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-[11px] font-mono text-primary">AI Operator speaking...</span>
              </div>
            )}

            {state.isAiResponding && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50">
                <Activity className="w-3.5 h-3.5 text-urgent animate-pulse" />
                <span className="text-[11px] font-mono text-muted-foreground">Analyzing...</span>
              </div>
            )}

            {/* Live partial transcript */}
            {scribe.partialTranscript && (
              <div className="px-3 py-2 rounded-lg bg-accent/30 border border-border/50">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Hearing...</span>
                <p className="text-xs text-foreground/70 italic">{scribe.partialTranscript}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Compact transcript in simulator */}
        {state.transcript.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Transcript</span>
            {state.transcript.slice(-6).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-[11px] leading-relaxed px-2 py-1 rounded ${
                  line.speaker === 'operator'
                    ? 'bg-primary/10 text-primary-foreground/80 border-l-2 border-primary/40'
                    : 'bg-accent/40 text-foreground/80 border-l-2 border-muted-foreground/30'
                }`}
              >
                <span className="font-mono text-[9px] text-muted-foreground uppercase mr-1.5">
                  {line.speaker === 'operator' ? 'AI' : 'YOU'}
                </span>
                {line.text}
              </motion.div>
            ))}
          </div>
        )}

        {/* Analysis panel */}
        <AnimatePresence>
          {state.analysis && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2 pt-2 border-t border-border/50"
            >
              <span className="text-[10px] font-mono text-muted-foreground uppercase">AI Assessment</span>
              
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                state.analysis.urgency === 'critical' ? 'bg-critical/10 text-critical' :
                state.analysis.urgency === 'urgent' ? 'bg-urgent/10 text-urgent' :
                'bg-stable/10 text-stable'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase">{state.analysis.urgency}</span>
                <span className="text-[10px] font-mono ml-auto">{state.analysis.confidence}%</span>
              </div>

              {state.analysis.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {state.analysis.symptoms.map((s, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {state.analysis.summary && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {state.analysis.summary}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display */}
        {state.error && (
          <div className="px-3 py-2 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-[11px] text-critical">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallSimulator;
