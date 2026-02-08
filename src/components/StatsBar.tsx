import { motion } from 'framer-motion';
import { Timer, TrendingDown, PhoneCall, Zap } from 'lucide-react';

interface StatsBarProps {
  activeCallsCount: number;
  avgResponseTime: string;
  dispatchDelay: string;
}

const StatsBar = ({ activeCallsCount, avgResponseTime, dispatchDelay }: StatsBarProps) => {
  const stats = [
    { label: 'Avg. Response Time', value: avgResponseTime, icon: Timer },
    { label: 'Active Calls', value: activeCallsCount.toString(), icon: PhoneCall },
    { label: 'Dispatch Delay', value: dispatchDelay, icon: TrendingDown },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 p-4 border-b border-border bg-card">
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
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsBar;
