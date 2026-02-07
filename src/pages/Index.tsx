import { useState, useEffect, useCallback } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import StatsBar from '@/components/StatsBar';
import CallQueue from '@/components/CallQueue';
import LiveTranscript from '@/components/LiveTranscript';
import TriagePanel from '@/components/TriagePanel';
import AmbulanceFleet from '@/components/AmbulanceFleet';
import AmbulanceMap from '@/components/AmbulanceMap';
import { mockCalls, mockAmbulances } from '@/data/mockCalls';
import { useSocket, useSocketEvent } from '@/hooks/useSocket';
import { Wifi, WifiOff } from 'lucide-react';
import type { EmergencyCall } from '@/data/mockCalls';

const Index = () => {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(mockCalls[0].id);
  const [calls, setCalls] = useState(mockCalls);
  const [showMap, setShowMap] = useState(false);
  const { isConnected } = useSocket();

  const selectedCall = calls.find(c => c.id === selectedCallId) ?? null;

  // Handle incoming calls from Socket.io
  const handleIncomingCall = useCallback((data: any) => {
    console.log('📞 Incoming call:', data);

    const newCall: EmergencyCall = {
      id: data.callSid,
      callerName: data.from || 'Unknown Caller',
      phone: data.from,
      location: 'Location pending...',
      urgency: 'urgent',
      status: 'active',
      summary: 'Call in progress...',
      symptoms: [],
      patientType: 'Unknown',
      confidence: 0,
      timestamp: new Date(data.timestamp),
      duration: 0,
      transcript: []
    };

    setCalls(prev => [newCall, ...prev]);
    setSelectedCallId(newCall.id);
  }, []);

  // Handle call analysis from Gemini
  const handleCallAnalyzed = useCallback((data: any) => {
    console.log('🤖 Call analyzed:', data);

    setCalls(prev => prev.map(call => {
      if (call.id === data.callSid) {
        return {
          ...call,
          transcript: data.transcript ? [
            { speaker: 'caller' as const, text: data.transcript, timestamp: '00:00' }
          ] : call.transcript,
          urgency: data.analysis.urgency,
          confidence: data.analysis.confidence,
          symptoms: data.analysis.symptoms,
          patientType: data.analysis.patientType,
          summary: data.analysis.summary,
          status: 'queued'
        };
      }
      return call;
    }));
  }, []);

  // Handle call status updates
  const handleCallStatus = useCallback((data: any) => {
    console.log('📊 Call status:', data);
  }, []);

  // Subscribe to Socket.io events
  useSocketEvent('incoming-call', handleIncomingCall);
  useSocketEvent('call-analyzed', handleCallAnalyzed);
  useSocketEvent('call-status', handleCallStatus);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader />

      {/* Connection Status Indicator */}
      <div className="px-4 py-1 bg-accent/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Connected to API</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">Offline - Using mock data</span>
            </>
          )}
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {showMap ? 'Show Fleet List' : 'Show Map'}
        </button>
      </div>

      <StatsBar />

      <div className="flex-1 grid grid-cols-[280px_1fr_320px_280px] min-h-0">
        {/* Call Queue */}
        <div className="border-r border-border overflow-hidden">
          <CallQueue
            calls={calls}
            selectedCallId={selectedCallId}
            onSelectCall={setSelectedCallId}
          />
        </div>

        {/* Live Transcript */}
        <div className="border-r border-border overflow-hidden">
          <LiveTranscript call={selectedCall} />
        </div>

        {/* AI Triage Panel */}
        <div className="border-r border-border overflow-hidden">
          <TriagePanel call={selectedCall} />
        </div>

        {/* Ambulance Fleet or Map */}
        <div className="overflow-hidden">
          {showMap ? (
            <AmbulanceMap ambulances={mockAmbulances} />
          ) : (
            <AmbulanceFleet ambulances={mockAmbulances} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
