import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';

import DashboardHeader from '@/components/DashboardHeader';
import StatsBar from '@/components/StatsBar';
import CallQueue from '@/components/CallQueue';
import DispatchRecommendation from '@/components/DispatchRecommendation';
import LiveTranscript from '@/components/LiveTranscript';
import TriagePanel from '@/components/TriagePanel';
import AmbulanceFleet from '@/components/AmbulanceFleet';
import AmbulanceMap from '@/components/AmbulanceMap';
import { useLiveScribe } from '@/hooks/useLiveScribe';
import { useCalls } from '@/hooks/useCalls';
import type { EmergencyCall, Ambulance } from '@/data/mockCalls';
import { mockAmbulances } from '@/data/mockCalls';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Link2, Map } from 'lucide-react';

const Index = () => {
  const { calls, addCall, updateCall, getCall, getPartial } = useCalls();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(calls[0]?.id ?? null);
  const [activeLiveCallId, setActiveLiveCallId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'triage' | 'fleet'>('triage');
  const [ambulances, setAmbulances] = useState<Ambulance[]>(mockAmbulances);
  const liveScribe = useLiveScribe({ fixedRole: 'operator' });

  // Auto-switch to triage tab when a call is selected
  const handleSelectCall = useCallback((callId: string) => {
    setSelectedCallId(callId);
    setRightPanelTab('triage');
  }, []);

  const pendingCallCount = useMemo(() => {
    return calls.filter(call => call.status === 'active' || call.status === 'queued').length;
  }, [calls]);

  const activeCallsCount = useMemo(() => {
    return calls.filter(call => call.status === 'active').length;
  }, [calls]);

  const avgResponseTime = useMemo(() => {
    const dispatchedCalls = calls.filter(call => call.status === 'dispatched' && call.dispatchedAt);
    if (dispatchedCalls.length === 0) return '0 min';

    const totalResponseTime = dispatchedCalls.reduce((sum, call) => {
      const responseTime = new Date(call.dispatchedAt!).getTime() - new Date(call.timestamp).getTime();
      return sum + responseTime;
    }, 0);

    const avgMillis = totalResponseTime / dispatchedCalls.length;
    const avgMinutes = Math.round(avgMillis / 60000);
    return avgMinutes > 0 ? `${avgMinutes} min` : '< 1 min';
  }, [calls]);

  const dispatchDelay = useMemo(() => {
    const queuedCalls = calls.filter(call => call.status === 'queued');
    if (queuedCalls.length === 0) return '0 min';

    const totalWaitTime = queuedCalls.reduce((sum, call) => {
      const elapsed = Date.now() - new Date(call.timestamp).getTime();
      return sum + elapsed;
    }, 0);

    const avgMillis = totalWaitTime / queuedCalls.length;
    const avgMinutes = Math.round(avgMillis / 60000);
    return avgMinutes > 0 ? `${avgMinutes} min` : '< 1 min';
  }, [calls]);

  useEffect(() => {
    if (activeLiveCallId && (liveScribe.isConnected || liveScribe.transcript.length > 0)) {
      if (liveScribe.partialTranscript?.trim()) {
        console.log('🗣️ UI Updating partial transcript with speaker:', liveScribe.role);
      }

      const currentTranscript = [...liveScribe.transcript];
      if (liveScribe.partialTranscript?.trim()) {
        currentTranscript.push({
          speaker: liveScribe.role,
          text: liveScribe.partialTranscript,
          timestamp: '--:--',
        });
      }

      updateCall(activeLiveCallId, {
        transcript: currentTranscript,
        duration: liveScribe.transcript.length * 2,
      });
    }
  }, [activeLiveCallId, liveScribe.transcript, liveScribe.partialTranscript, liveScribe.isConnected, liveScribe.role, updateCall]);

  const selectedCall = getCall(selectedCallId);
  const displayCall = selectedCall;

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
  }, [liveScribe, activeLiveCallId, updateCall, getCall, updateCall]);

  const handleOverride = useCallback(
    (callId: string, urgency: EmergencyCall['urgency']) => {
      updateCall(callId, { urgency, status: 'queued' });
    },
    [updateCall]
  );

  const handleDispatch = useCallback(
    (callId: string, ambulanceId: string) => {
      const call = getCall(callId);
      updateCall(callId, { status: 'dispatched', dispatchedAt: new Date() });

      // Update ambulance status to en-route
      setAmbulances(prev => prev.map(amb =>
        amb.id === ambulanceId
          ? {
            ...amb,
            status: 'en-route' as const,
            assignedCall: callId,
            location: `En route to ${call?.location || 'caller'}`,
            eta: Math.floor(Math.random() * 10) + 3 // Random ETA 3-12 min
          }
          : amb
      ));
    },
    [updateCall, getCall]
  );

  const handleResolve = useCallback(
    (callId: string) => {
      updateCall(callId, { status: 'resolved', resolvedAt: new Date() });

      // Find and release the ambulance assigned to this call
      setAmbulances(prev => prev.map(amb =>
        amb.assignedCall === callId
          ? {
            ...amb,
            status: 'available' as const,
            assignedCall: undefined,
            location: amb.location.includes('En route') ? 'Station' : amb.location,
            eta: undefined
          }
          : amb
      ));
    },
    [updateCall]
  );

  const callerLink = activeLiveCallId ? `/caller/${activeLiveCallId}` : null;

  const [showMap, setShowMap] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader pendingCallCount={pendingCallCount} />
      <StatsBar
        activeCallsCount={activeCallsCount}
        avgResponseTime={avgResponseTime}
        dispatchDelay={dispatchDelay}
      />

      <div className="flex-1 grid grid-cols-[280px_1fr_320px] min-h-0">
        {/* Call Queue */}
        <div className="border-r border-border overflow-hidden flex flex-col">
          <DispatchRecommendation
            calls={calls}
            ambulances={ambulances}
            onSelectCall={handleSelectCall}
          />
          <div className="flex-1 min-h-0">
            <CallQueue
              calls={calls}
              selectedCallId={selectedCallId}
              onSelectCall={handleSelectCall}
            />
          </div>
        </div>

        {/* Live Transcript */}
        <div className="border-r border-border overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={showMap ? "default" : "outline"}
              onClick={() => setShowMap(!showMap)}
            >
              <Map className="w-3.5 h-3.5 mr-1.5" />
              {showMap ? 'Hide' : 'Show'} Map
            </Button>
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
            {showMap ? (
              <AmbulanceMap ambulances={ambulances} calls={calls} />
            ) : (
              <LiveTranscript call={displayCall} />
            )}
          </div>
        </div>

        {/* Right Panel with Tabs */}
        <div className="overflow-hidden flex flex-col">
          {/* Tab Headers */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setRightPanelTab('triage')}
              className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${rightPanelTab === 'triage'
                  ? 'bg-accent text-accent-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:bg-accent/50'
                }`}
            >
              AI Triage
            </button>
            <button
              onClick={() => setRightPanelTab('fleet')}
              className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${rightPanelTab === 'fleet'
                  ? 'bg-accent text-accent-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:bg-accent/50'
                }`}
            >
              Fleet Status
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'triage' ? (
              <TriagePanel
                call={displayCall}
                ambulances={ambulances}
                onOverride={displayCall ? (u) => handleOverride(displayCall.id, u) : undefined}
                onDispatch={displayCall ? (ambulanceId: string) => handleDispatch(displayCall.id, ambulanceId) : undefined}
                onResolve={displayCall ? () => handleResolve(displayCall.id) : undefined}
              />
            ) : (
              <AmbulanceFleet ambulances={ambulances} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
