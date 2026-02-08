import { useState, useCallback } from 'react';
import { useScribe } from '@elevenlabs/react';
import type { TranscriptLine } from '@/data/mockCalls';

const API_BASE = '/api';

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Hook for live transcription via ElevenLabs Scribe Realtime.
 * Fetches a single-use token from our backend, connects the mic, and streams
 * transcript lines into the format expected by LiveTranscript.
 */
export function useLiveScribe() {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);  const [currentSpeaker, setCurrentSpeaker] = useState<'caller' | 'operator'>('caller');
  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    onPartialTranscript: () => {
      // Partial is available on scribe.partialTranscript; we use it in the UI separately
    },
    onCommittedTranscript: (data: { text: string }) => {
      if (!data.text?.trim()) return;
      const elapsed = startTime != null ? (Date.now() - startTime) / 1000 : 0;
      setLines((prev) => [
        ...prev,
        {
          speaker: 'caller',
          text: data.text.trim(),
          timestamp: formatTimestamp(elapsed),
        },
      ]);
    },
  });

  const start = useCallback(async () => {
    setTokenError(null);
    setLines([]);
    setStartTime(Date.now());

    let token: string;
    try {
      const res = await fetch(`${API_BASE}/scribe-token`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? err.details ?? 'Failed to get token');
      }
      const data = await res.json();
      token = data.token;
      if (!token) throw new Error('No token in response');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not get transcription token';
      setTokenError(message);
      return;
    }

    try {
      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        language: 'en', // Explicitly set to English for better accuracy
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not connect to Scribe';
      setTokenError(message);
    }
  }, [scribe]);

  const stop = useCallback(() => {
    scribe.disconnect();
  }, [scribe]);

  return {
    transcript: lines,
    partialTranscript: scribe.partialTranscript ?? '',
    isConnected: scribe.isConnected ?? false,
    error: tokenError,
    start,
    stop,
  };
}
