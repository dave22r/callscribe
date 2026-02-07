import { motion } from 'framer-motion';
import { Timer, TrendingDown, PhoneCall, Zap } from 'lucide-react';

const stats = [
  { label: 'Avg. Response Time', value: '4.2 min', change: '-18%', icon: Timer, positive: true },
  { label: 'Active Calls', value: '4', change: '+2', icon: PhoneCall, positive: false },
  { label: 'AI Accuracy', value: '94.3%', change: '+2.1%', icon: Zap, positive: true },
  { label: 'Dispatch Delay', value: '1.8 min', change: '-32%', icon: TrendingDown, positive: true },
];

const StatsBar = () => {
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
