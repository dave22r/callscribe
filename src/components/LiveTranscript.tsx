import { Mic, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EmergencyCall } from '@/data/mockCalls';

interface LiveTranscriptProps {
  call: EmergencyCall | null;
}

const highlightKeywords = (text: string, keywords?: string[]) => {
  if (!keywords || keywords.length === 0) return text;

  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <span key={i} className="bg-critical/20 text-critical font-medium px-0.5 rounded-sm">
          {part}
        </span>
      );
    }
    return part;
  });
};

const LiveTranscript = ({ call }: LiveTranscriptProps) => {
  if (!call) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <Mic className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-sm">Select a call to view transcript</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live Transcript
          </h2>
          {call.status === 'active' && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-critical/10">
              <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse-critical" />
              <span className="text-[10px] font-mono text-critical font-medium">LIVE</span>
            </div>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{call.id.toUpperCase()}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {call.transcript.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`flex gap-3 ${line.speaker === 'caller' ? '' : 'flex-row-reverse'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              line.speaker === 'operator' ? 'bg-primary/15' : 'bg-accent'
            }`}>
              {line.speaker === 'operator' ? (
                <Zap className="w-3 h-3 text-primary" />
              ) : (
                <User className="w-3 h-3 text-muted-foreground" />
              )}
            </div>

            <div className={`max-w-[80%] ${line.speaker === 'caller' ? '' : 'text-right'}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  {line.speaker}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {line.timestamp}
                </span>
              </div>
              <p className={`text-sm leading-relaxed rounded-lg px-3 py-2 ${
                line.speaker === 'operator'
                  ? 'bg-primary/10 text-foreground'
                  : 'bg-accent text-foreground'
              }`}>
                {highlightKeywords(line.text, line.keywords)}
              </p>
            </div>
          </motion.div>
        ))}

        {call.status === 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-3 py-2"
          >
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Listening...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LiveTranscript;
