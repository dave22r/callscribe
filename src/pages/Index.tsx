import { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import StatsBar from '@/components/StatsBar';
import CallQueue from '@/components/CallQueue';
import LiveTranscript from '@/components/LiveTranscript';
import TriagePanel from '@/components/TriagePanel';
import AmbulanceFleet from '@/components/AmbulanceFleet';
import { mockCalls, mockAmbulances } from '@/data/mockCalls';

const Index = () => {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(mockCalls[0].id);
  const selectedCall = mockCalls.find(c => c.id === selectedCallId) ?? null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader />
      <StatsBar />

      <div className="flex-1 grid grid-cols-[280px_1fr_320px_280px] min-h-0">
        {/* Call Queue */}
        <div className="border-r border-border overflow-hidden">
          <CallQueue
            calls={mockCalls}
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

        {/* Ambulance Fleet */}
        <div className="overflow-hidden">
          <AmbulanceFleet ambulances={mockAmbulances} />
        </div>
      </div>
    </div>
  );
};

export default Index;
