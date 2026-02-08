import { useState, useCallback, useEffect, useRef } from 'react';
import type { TranscriptLine } from '@/data/mockCalls';

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Hook for live transcription using browser's Web Speech API
 * This is a fallback when ElevenLabs Scribe has issues
 */
export function useWebSpeechTranscription() {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<'caller' | 'operator'>('caller');
  const [partialText, setPartialText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const currentSpeakerRef = useRef(currentSpeaker);

  // Keep ref in sync
  useEffect(() => {
    currentSpeakerRef.current = currentSpeaker;
  }, [currentSpeaker]);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setPartialText(interim);
      }

      if (final) {
        // console.log('✍️ Final:', final);
        const speaker = currentSpeakerRef.current;

        setLines((prev) => {
          // Use Date.now() for relative timestamp if startTime is not reliable in this context,
          // or just 00:00 if we don't have a good ref. 
          // Ideally we pass a ref for startTime too.
          return [
            ...prev,
            {
              speaker,
              text: final.trim(),
              timestamp: formatTimestamp(0),
            },
          ];
        });
        setPartialText('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startTimeRef = useRef<number | null>(null);

  // Update the onresult handler to use the refs if we want better timestamping
  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) setPartialText(interim);

      if (final) {
        const elapsed = startTimeRef.current != null ? (Date.now() - startTimeRef.current) / 1000 : 0;
        setLines((prev) => [
          ...prev,
          {
            speaker: currentSpeakerRef.current,
            text: final.trim(),
            timestamp: formatTimestamp(elapsed),
          },
        ]);
        setPartialText('');
      }
    };
  }, []);

  const start = useCallback(async () => {
    console.log('🎤 Starting Web Speech transcription...');
    setError(null);
    setLines([]);
    setPartialText('');
    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;
    setIsListening(true);

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { }

        setTimeout(() => {
          recognitionRef.current.start();
          console.log('✅ Speech recognition started!');
        }, 100);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not start speech recognition';
      console.error('❌ Start error:', message);
      setError(message);
      setIsListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    console.log('🛑 Stopping transcription...');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setCurrentSpeaker(prev => prev === 'caller' ? 'operator' : 'caller');
  }, []);

  return {
    transcript: lines,
    partialTranscript: partialText,
    isConnected: isListening,
    error,
    currentSpeaker,
    start,
    stop,
    toggleSpeaker,
  };
}
