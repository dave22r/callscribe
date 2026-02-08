import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import DashboardHeader from '@/components/DashboardHeader';
import StatsBar from '@/components/StatsBar';
import CallQueue from '@/components/CallQueue';
import DispatchRecommendation from '@/components/DispatchRecommendation';
import LiveTranscript from '@/components/LiveTranscript';
import TriagePanel from '@/components/TriagePanel';
import { useLiveScribe } from '@/hooks/useLiveScribe';
import { useCalls } from '@/hooks/useCalls';
import type { EmergencyCall } from '@/data/mockCalls';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Link2 } from 'lucide-react';

const Index = () => {
  const { calls, addCall, updateCall, getCall, getPartial } = useCalls();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(calls[0]?.id ?? null);
  const [activeLiveCallId, setActiveLiveCallId] = useState<string | null>(null);
  const liveScribe = useLiveScribe();

  const pendingCallCount = useMemo(() => {
    return calls.filter(call => call.status === 'active' || call.status === 'queued').length;
  }, [calls]);

  useEffect(() => {
    if (activeLiveCallId && (liveScribe.isConnected || liveScribe.transcript.length > 0)) {
      if (liveScribe.partialTranscript?.trim()) {
        console.log('🗣️ UI Updating partial transcript with speaker:', liveScribe.currentSpeaker);
      }

      const currentTranscript = [...liveScribe.transcript];
      if (liveScribe.partialTranscript?.trim()) {
        currentTranscript.push({
          speaker: liveScribe.currentSpeaker,
          text: liveScribe.partialTranscript,
          timestamp: '--:--',
        });
      }

    return {
      ...base,
      transcript,
    } as EmergencyCall;
  }, [activeCall, selectedCall, liveScribe.partialTranscript, liveScribe.role, activeLiveCallId, getPartial]);

  const handleStartLive = useCallback(() => {
    const newCall = addCall([]);

    updateCall(newCall.id, {
      callerName: 'Live Caller',
      status: 'active',
      urgency: 'stable',
      summary: 'Live call in progress...',
      confidence: 0,
      timestamp: new Date(),
    });

    setSelectedCallId(newCall.id);
    setActiveLiveCallId(newCall.id);
  }, [addCall, updateCall]);

  const handleUnmute = useCallback(async () => {
    if (!activeLiveCallId) return;
    await liveScribe.unmute(activeLiveCallId);
  }, [activeLiveCallId, liveScribe]);

  const handleMute = useCallback(() => {
    liveScribe.mute();
  }, [liveScribe]);

  const handleStopLive = useCallback(async () => {
    if (!activeLiveCallId) return;

    await liveScribe.stop();

    const currentCall = getCall(activeLiveCallId);
    const transcriptLines = currentCall?.transcript ? [...currentCall.transcript] : [];

    if (liveScribe.partialTranscript?.trim()) {
      transcriptLines.push({
        speaker: liveScribe.role,
        text: liveScribe.partialTranscript,
        timestamp: '--:--',
      });
    }

    updateCall(activeLiveCallId, {
      status: 'processing',
      summary: 'Analyzing call...',
      transcript: transcriptLines,
    });

    if (transcriptLines.length > 0) {
      try {
        const fullConversation = transcriptLines
          .map(line => `${line.speaker === 'caller' ? 'Patient' : 'Operator'}: ${line.text}`)
          .join('\n');

        const response = await fetch('/api/calls/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: fullConversation })
        });

        const data = await response.json();

        if (data.success && data.analysis) {
          const { analysis } = data;

          updateCall(activeLiveCallId, {
            callerName: analysis.patientName || 'Unknown Patient',
            patientType: analysis.patientType || 'Unknown',
            urgency: analysis.urgency || 'stable',
            symptoms: analysis.symptoms || [],
            location: analysis.location || 'Unknown',
            summary: analysis.summary || 'Call processed',
            status: 'queued',
            confidence: analysis.confidence || 85,
            tags: analysis.keywords
          });
        } else {
          updateCall(activeLiveCallId, { status: 'queued', summary: 'Analysis failed (backend error).' });
        }
      } catch (error) {
        console.error('Analysis failed', error);
        updateCall(activeLiveCallId, { status: 'queued', summary: 'Analysis failed (Network Error).' });
      }
    } else {
      updateCall(activeLiveCallId, { status: 'queued', summary: 'Empty call' });
    }

      setActiveLiveCallId(null);
    }
  }, [liveScribe, activeLiveCallId, updateCall]);

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

  const handleResolve = useCallback(
    (callId: string) => {
      updateCall(callId, { status: 'resolved' });
    },
    [updateCall]
  );

  const [showMap, setShowMap] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader pendingCallCount={pendingCallCount} />
      <StatsBar />

      <div className="flex-1 grid grid-cols-[280px_1fr_320px] min-h-0">
        {/* Call Queue */}
        <div className="border-r border-border overflow-hidden flex flex-col">
          <DispatchRecommendation
            calls={calls}
            onSelectCall={setSelectedCallId}
          />
          <div className="flex-1 min-h-0">
            <CallQueue
              calls={calls}
              selectedCallId={selectedCallId}
              onSelectCall={setSelectedCallId}
            />
          </div>
        </div>

        {/* Live Transcript */}
        <div className="border-r border-border overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 shrink-0">
            {!activeLiveCallId ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartLive}
              >
                <Mic className="w-3.5 h-3.5 mr-1.5" />
                Start shared call
              </Button>
            ) : (
              <>
                <Button size="sm" variant="destructive" onClick={handleStopLive}>
                  <Square className="w-3.5 h-3.5 mr-1.5" />
                  End call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUnmute}
                  disabled={liveScribe.isConnecting || liveScribe.isConnected}
                  className="ml-2"
                >
                  <Mic className="w-3.5 h-3.5 mr-1.5" />
                  Unmute operator
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMute}
                  disabled={!liveScribe.isConnected}
                >
                  <MicOff className="w-3.5 h-3.5 mr-1.5" />
                  Mute operator
                </Button>
                {callerLink && (
                  <Link to={callerLink} className="ml-2">
                    <Button size="sm" variant="secondary">
                      <Link2 className="w-3.5 h-3.5 mr-1.5" />
                      Open caller view
                    </Button>
                  </Link>
                )}
              </>
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
            onOverride={displayCall ? (u) => handleOverride(displayCall.id, u) : undefined}
            onDispatch={displayCall ? () => handleDispatch(displayCall.id) : undefined}
            onResolve={displayCall ? () => handleResolve(displayCall.id) : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
