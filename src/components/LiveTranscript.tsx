import { Mic, User, Zap, Globe } from 'lucide-react';
import { useState } from 'react';
import { translateLines } from '@/lib/translate';
import { motion } from 'framer-motion';
import type { EmergencyCall } from '@/data/mockCalls';

// Mock translations for real-time demo
export const mockTranslations: Record<string, string> = {
  'Services d\'urgence, quelle est votre urgence?': 'Emergency services, what is your emergency?',
  'S\'il vous plaît, aidez-moi. J\'ai une forte douleur à la poitrine et j\'ai du mal à respirer.': 'Please help me. I have severe chest pain and difficulty breathing.',
  'Êtes-vous consciente? Pouvez-vous me parler?': 'Are you conscious? Can you talk to me?',
  'Oui, mais je me sens très faible et j\'ai des vertiges.': 'Yes, but I feel very weak and dizzy.',
  'Quel âge avez-vous?': 'How old are you?',
  'J\'ai 52 ans. J\'ai aussi des douleurs dans le bras gauche.': 'I am 52 years old. I also have pain in my left arm.',
  'Restez calme. L\'ambulance arrive tout de suite.': 'Stay calm. The ambulance is coming right away.',
  'Merci, dépêchez-vous s\'il vous plaît.': 'Thank you, please hurry.',
  '52-year-old female, severe chest pain and shortness of breath.': 'Femme de 52 ans, douleur thoracique sévère et essoufflement.',
  'Caller took a fall while running, reporting leg injury and bleeding. Conscious but unable to stand.': 'L\'appelant a fait une chute en courant, signale une blessure à la jambe et des saignements. Conscient mais incapable de se tenir debout.',
};

interface LiveTranscriptProps {
  call: EmergencyCall | null;
  realtimeTranslation: boolean;
  setRealtimeTranslation: (value: boolean) => void;
}

const highlightKeywords = (text: string, keywords?: string[], urgency: EmergencyCall['urgency'] = 'stable') => {
  if (!keywords || keywords.length === 0) return text;

  // Escape special regex characters to prevent crashes
  const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  const styles = {
    critical: 'bg-critical/20 text-critical border-critical/20',
    urgent: 'bg-urgent/20 text-urgent border-urgent/20',
    stable: 'bg-stable/20 text-stable border-stable/20'
  };

  const activeStyle = styles[urgency] || styles.stable;

  return parts.map((part, i) => {
    const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <span key={i} className={`${activeStyle} font-bold px-1 rounded-sm border`}>
          {part}
        </span>
      );
    }
    return part;
  });
};

const LiveTranscript = ({ call, realtimeTranslation, setRealtimeTranslation }: LiveTranscriptProps) => {
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
        <div className="flex gap-2">
          <button
            className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1 hover:bg-primary/20"
            onClick={() => setRealtimeTranslation(!realtimeTranslation)}
          >
            <Globe className="w-4 h-4" />
            {realtimeTranslation ? 'Hide Translation' : 'Show Translation'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {call.transcript.map((line, index) => {
          // Combine line-specific keywords with global call symptoms for highlighting
          const allKeywords = Array.from(new Set([
            ...(line.keywords || []),
            ...(call.symptoms || [])
          ]));

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`flex gap-3 ${line.speaker === 'caller' ? '' : 'flex-row-reverse'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${line.speaker === 'operator' ? 'bg-primary/15' : 'bg-accent'
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
                <p className={`text-sm leading-relaxed rounded-lg px-3 py-2 ${line.speaker === 'operator'
                  ? 'bg-primary/10 text-foreground'
                  : 'bg-accent text-foreground'
                  }`}>
                  {highlightKeywords(line.text, allKeywords, call.urgency)}
                </p>
                {realtimeTranslation && (
                  <p className="text-xs text-muted-foreground italic mt-1 px-3">
                    🌐 {mockTranslations[line.text] || line.text}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}

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
