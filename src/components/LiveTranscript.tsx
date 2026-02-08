import { Mic, User, Zap, Globe } from 'lucide-react';
import { useState } from 'react';
import { translateLines } from '@/lib/translate';
import { motion } from 'framer-motion';
import type { EmergencyCall } from '@/data/mockCalls';

// Mock translations for real-time demo
const mockTranslations: Record<string, string> = {
  'Servicios de emergencia, ¿cuál es su emergencia?': 'Emergency services, what is your emergency?',
  'Por favor, ayúdame. Tengo un dolor fuerte en el pecho y me cuesta respirar.': 'Please help me. I have strong chest pain and difficulty breathing.',
  '¿Está consciente?': 'Are you conscious?',
  'Sí, pero me siento muy débil y mareado.': 'Yes, but I feel very weak and dizzy.',
  '¿Cuántos años tiene?': 'How old are you?',
  'Tengo 45 años.': 'I am 45 years old.',
};

interface LiveTranscriptProps {
  call: EmergencyCall | null;
}

const DEFAULT_KEYWORDS = [
  'not breathing', 'unconscious', 'bleeding', 'chest pain', 'heart attack',
  'emergency', 'help', 'critical', 'severe', 'pain', 'fell', 'accident',
  'breathing', 'conscious', 'sweating', 'numb', 'numbness', 'stroke',
  'seizure', 'overdose', 'choking', 'allergic', 'burn', 'injury',
];

function highlightKeywords(text: string, keywords?: string[]) {
  const list = keywords?.length ? keywords : DEFAULT_KEYWORDS;
  const regex = new RegExp(`(${list.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isKeyword = list.some((k) => part.toLowerCase() === k.toLowerCase());
    if (isKeyword && part) {
      return (
        <span key={i} className="bg-critical/20 text-critical font-medium px-0.5 rounded-sm">
          {part}
        </span>
      );
    }
    return part;
  });
}

const LiveTranscript = ({ call }: LiveTranscriptProps) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [realtimeTranslation, setRealtimeTranslation] = useState(false);

  async function handleTranslate() {
    setLoading(true);
    const originalLines = call?.transcript.map((line) => line.text) || [];
    try {
      const translatedLines = await translateLines(originalLines, 'en');
      setTranslation(translatedLines);
      setShowTranslation(true);
    } catch (e) {
      setTranslation(['Translation failed.']);
      setShowTranslation(true);
    }
    setLoading(false);
  }
  if (!call) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <Mic className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-sm">Select a call to view transcript</p>
      </div>
    );
  }

  // Gather all detected critical/urgent phrases
  const detectedPhrases = call.transcript
    .flatMap((line) => {
      const list = line.keywords?.length ? line.keywords : DEFAULT_KEYWORDS;
      return list.filter((k) => line.text.toLowerCase().includes(k.toLowerCase()));
    })
    .filter((v, i, arr) => arr.indexOf(v) === i); // unique

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

      {/* AI assistive info */}
      <div className="px-4 py-2 bg-accent/20 text-xs text-muted-foreground border-b border-border">
        <strong>Note:</strong> AI is only assisting by highlighting and structuring information. All decisions and communication are made by the dispatcher.
      </div>

      {detectedPhrases.length > 0 && (
        <div className="px-4 py-2 bg-warning/10 text-warning-foreground text-xs border-b border-warning">
          <strong>Critical phrases detected:</strong> {detectedPhrases.join(', ')}
        </div>
      )}

      {/* Translation Popup */}
      {showTranslation && (
        <div className="fixed top-20 right-8 z-50 bg-background border border-border rounded-lg shadow-lg p-6 w-96">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-primary">English Translation</span>
            <button
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => setShowTranslation(false)}
            >Close</button>
          </div>
          <div className="text-sm whitespace-pre-line">
            {translation && translation.map((line, idx) => (
              <div key={idx} className="mb-2">{line}</div>
            ))}
          </div>
        </div>
      )}

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
              {realtimeTranslation && (
                <p className="text-xs text-muted-foreground italic mt-1 px-3">
                  🌐 {mockTranslations[line.text] || `[Translation: ${line.text}]`}
                </p>
              )}
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
