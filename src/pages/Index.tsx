import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import StatsBar from '@/components/StatsBar';
import CallQueue from '@/components/CallQueue';
import LiveTranscript from '@/components/LiveTranscript';
import TriagePanel from '@/components/TriagePanel';
import AmbulanceFleet from '@/components/AmbulanceFleet';
import AmbulanceMap from '@/components/AmbulanceMap';
import CallSimulator from '@/components/CallSimulator';
import { mockCalls, mockAmbulances } from '@/data/mockCalls';
import type { EmergencyCall } from '@/data/mockCalls';
import { Phone } from 'lucide-react';

const Index = () => {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(mockCalls[0].id);
  const [calls, setCalls] = useState(mockCalls);
  const [showMap, setShowMap] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const selectedCall = calls.find(c => c.id === selectedCallId) ?? null;

  const handleSimulatorCallUpdate = useCallback((callData: Partial<EmergencyCall> & { id: string }) => {
    setCalls(prev => {
      const exists = prev.find(c => c.id === callData.id);
      if (exists) {
        return prev.map(c => c.id === callData.id ? { ...c, ...callData } as EmergencyCall : c);
      }
      return [callData as EmergencyCall, ...prev];
    });
    setSelectedCallId(callData.id);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader />

      {/* Connection Status Indicator */}
      <div className="px-4 py-1 bg-accent/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium transition-colors ${
              showSimulator
                ? 'bg-critical/15 text-critical border border-critical/30'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            <Phone className="w-3 h-3" />
            {showSimulator ? 'Hide Simulator' : 'Call Simulator'}
          </button>
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {showMap ? 'Show Fleet List' : 'Show Map'}
        </button>
      </div>

      <StatsBar />

      <div className={`flex-1 grid ${showSimulator ? 'grid-cols-[260px_280px_1fr_320px]' : 'grid-cols-[280px_1fr_320px_280px]'} min-h-0`}>
        {/* Call Simulator (conditional) */}
        {showSimulator && (
          <div className="border-r border-border overflow-hidden">
            <CallSimulator onCallUpdate={handleSimulatorCallUpdate} />
          </div>
        )}

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
        <div className={`${showSimulator ? '' : 'border-r border-border'} overflow-hidden`}>
          <TriagePanel call={selectedCall} />
        </div>

        {/* Ambulance Fleet or Map (hidden when simulator is open to save space) */}
        {!showSimulator && (
          <div className="overflow-hidden">
            {showMap ? (
              <AmbulanceMap ambulances={mockAmbulances} />
            ) : (
              <AmbulanceFleet ambulances={mockAmbulances} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
