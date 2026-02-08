import { motion } from 'framer-motion';
import { Timer, TrendingDown, PhoneCall, Zap } from 'lucide-react';
import type { EmergencyCall } from '@/data/mockCalls';

interface StatsBarProps {
  calls?: EmergencyCall[];
}

const StatsBar = ({ calls = [] }: StatsBarProps) => {
  const active = calls.filter((c) => c.status === 'active').length;
  const queued = calls.filter((c) => c.status === 'queued').length;
  const dispatched = calls.filter((c) => c.status === 'dispatched').length;
  const avgConfidence =
    calls.length > 0
      ? Math.round(
          calls.reduce((s, c) => s + c.confidence, 0) / calls.length
        )
      : 0;

  const stats = [
    { label: 'Active Calls', value: String(active), change: `${calls.length} total`, icon: PhoneCall, positive: active <= 2 },
    { label: 'Queued', value: String(queued), change: '', icon: Timer, positive: true },
    // { label: 'AI Confidence', value: `${avgConfidence}%`, change: calls.length ? 'avg' : '', icon: Zap, positive: avgConfidence >= 80 },
    { label: 'Dispatched', value: String(dispatched), change: '', icon: TrendingDown, positive: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 p-4 border-b border-border bg-card">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/30"
        >
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <stat.icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold font-mono">{stat.value}</span>
              <span className={`text-[10px] font-mono ${stat.positive ? 'text-stable' : 'text-urgent'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsBar;
