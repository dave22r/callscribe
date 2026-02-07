import { useState, useMemo, useCallback } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import StatsBar from '@/components/StatsBar';
import CallQueue from '@/components/CallQueue';
import LiveTranscript from '@/components/LiveTranscript';
import TriagePanel from '@/components/TriagePanel';
import { useLiveScribe } from '@/hooks/useLiveScribe';
import { useCalls } from '@/hooks/useCalls';
import type { EmergencyCall } from '@/data/mockCalls';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

const Index = () => {
  const { calls, addCall, updateCall, getCall } = useCalls();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(calls[0]?.id ?? null);
  const liveScribe = useLiveScribe();

  const selectedCall = getCall(selectedCallId);

  const liveCall: EmergencyCall | null = useMemo(() => {
    if (!liveScribe.isConnected && liveScribe.transcript.length === 0 && !liveScribe.partialTranscript) return null;
    const transcriptLines = [...liveScribe.transcript];
    if (liveScribe.partialTranscript.trim()) {
      transcriptLines.push({
        speaker: 'caller',
        text: liveScribe.partialTranscript,
        timestamp: '--:--',
      });
    }
    return {
      id: 'live',
      callerName: 'Live call',
      phone: '',
      location: '',
      urgency: 'stable' as const,
      status: 'active' as const,
      summary: 'Real-time transcription via ElevenLabs Scribe',
      symptoms: [],
      patientType: '',
      confidence: 0,
      timestamp: new Date(),
      duration: 0,
      transcript: transcriptLines,
    };
  }, [liveScribe.isConnected, liveScribe.transcript, liveScribe.partialTranscript]);

  const displayCall = liveCall ?? selectedCall;

  const handleStopLive = useCallback(() => {
    liveScribe.stop();
    if (liveScribe.transcript.length > 0) {
      const saved = addCall(liveScribe.transcript);
      setSelectedCallId(saved.id);
    }
  }, [liveScribe, addCall]);

  const handleAccept = useCallback(
    (callId: string) => {
      updateCall(callId, { status: 'queued' });
    },
    [updateCall]
  );

  const handleOverride = useCallback(
    (callId: string, urgency: EmergencyCall['urgency']) => {
      updateCall(callId, { urgency, status: 'queued' });
    },
    [updateCall]
  );

  const handleDispatch = useCallback(
    (callId: string) => {
      updateCall(callId, { status: 'dispatched' });
    },
    [updateCall]
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader />
      <StatsBar calls={calls} />

      <div className="flex-1 grid grid-cols-[280px_1fr_320px] min-h-0">
        {/* Call Queue */}
        <div className="border-r border-border overflow-hidden">
          <CallQueue
            calls={calls}
            selectedCallId={selectedCallId}
            onSelectCall={setSelectedCallId}
          />
        </div>

        {/* Live Transcript */}
        <div className="border-r border-border overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 shrink-0">
            {!liveScribe.isConnected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={liveScribe.start}
                disabled={liveScribe.isConnected}
              >
                <Mic className="w-3.5 h-3.5 mr-1.5" />
                Start live transcription
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={handleStopLive}>
                <Square className="w-3.5 h-3.5 mr-1.5" />
                Stop & save
              </Button>
            )}
            {liveScribe.error && (
              <span className="text-xs text-destructive">{liveScribe.error}</span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <LiveTranscript call={displayCall} />
          </div>
        </div>

        {/* AI Triage Panel */}
        <div className="overflow-hidden">
          <TriagePanel
            call={displayCall}
            onAccept={displayCall ? () => handleAccept(displayCall.id) : undefined}
            onOverride={displayCall ? (u) => handleOverride(displayCall.id, u) : undefined}
            onDispatch={displayCall ? () => handleDispatch(displayCall.id) : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
