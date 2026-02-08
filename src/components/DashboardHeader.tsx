import { Activity, Radio, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardHeaderProps {
  pendingCallCount?: number;
}

const DashboardHeader = ({ pendingCallCount = 0 }: DashboardHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-critical/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-critical" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight leading-none">
              Call<span className="text-critical">Scribe</span>
            </h1>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">AI-Assisted Triage</p>
          </div>
        </div>

        <div className="h-6 w-px bg-border mx-2" />

        {/* <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-stable/10">
          <div className="w-1.5 h-1.5 rounded-full bg-stable animate-pulse" />
          {/* <span className="text-[11px] font-mono text-stable font-medium">SYSTEM ONLINE</span> */}
        {/* </div> */}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Radio className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono">{pendingCallCount} PENDING {pendingCallCount === 1 ? 'CALL' : 'CALLS'}</span>
        </div>

        {/* <div className="flex items-center gap-1.5 text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono">5 UNITS</span>
        </div> */}

        <div className="text-right">
          <p className="text-[11px] font-mono text-foreground leading-none">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </p>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
            {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
