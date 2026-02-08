import { Truck, Navigation, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Ambulance } from '@/data/mockCalls';

interface AmbulanceFleetProps {
  ambulances: Ambulance[];
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string; bg: string }> = {
  available: { label: 'AVAILABLE', color: 'text-stable', dotColor: 'bg-stable', bg: 'bg-stable/5' },
  'en-route': { label: 'EN ROUTE', color: 'text-urgent', dotColor: 'bg-urgent', bg: 'bg-urgent/5' },
  'on-scene': { label: 'ON SCENE', color: 'text-critical', dotColor: 'bg-critical', bg: 'bg-critical/5' },
};

const AmbulanceFleet = ({ ambulances }: AmbulanceFleetProps) => {
  const available = ambulances.filter(a => a.status === 'available').length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fleet Status
          </h2>
        </div>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
          available > 0 ? 'bg-stable/10 text-stable' : 'bg-critical/10 text-critical'
        }`}>
          {available} AVAILABLE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {ambulances.map((amb, index) => {
          const cfg = statusConfig[amb.status];

          return (
            <motion.div
              key={amb.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`px-4 py-3 border-b border-border ${cfg.bg} hover:bg-accent/20 transition-colors`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-foreground">{amb.unit}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} ${
                    amb.status === 'en-route' ? 'animate-pulse' : ''
                  }`} />
                  <span className={`text-[10px] font-mono font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-[11px]">{amb.crew}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Navigation className="w-3 h-3" />
                  <span className="text-[11px] truncate">{amb.location}</span>
                </div>
                {amb.eta && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-urgent" />
                    <span className="text-[11px] font-mono text-urgent">ETA {amb.eta} min</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AmbulanceFleet;
