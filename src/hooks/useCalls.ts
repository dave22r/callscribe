import { useState, useCallback, useEffect } from 'react';
import type { EmergencyCall, TranscriptLine } from '@/data/mockCalls';
import {
  getAllCalls,
  addSavedCall as storeAddCall,
  updateSavedCall as storeUpdateCall,
  isSavedCall,
} from '@/lib/callStore';
import { parseTranscript } from '@/lib/transcriptParser';

/**
 * Reactive call store. Loads mock + saved calls, provides add/update with persistence.
 * Mock calls support in-memory overrides (e.g. Accept); saved calls persist to localStorage.
 */
export function useCalls() {
  const [calls, setCalls] = useState<EmergencyCall[]>(() => getAllCalls());
  const [overrides, setOverrides] = useState<Record<string, Partial<EmergencyCall>>>({});

  const refresh = useCallback(() => {
    setCalls(getAllCalls());
  }, []);

  const addCall = useCallback((transcript: TranscriptLine[]) => {
    const parsed = parseTranscript(transcript);
    const call = storeAddCall(transcript, parsed);
    setCalls(getAllCalls());
    return call;
  }, []);

  const updateCall = useCallback((id: string, updates: Partial<EmergencyCall>) => {
    if (isSavedCall(id)) {
      storeUpdateCall(id, updates);
      setCalls(getAllCalls());
    } else {
      setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
    }
  }, []);

  const getCall = useCallback(
    (id: string | null): EmergencyCall | null => {
      if (!id) return null;
      const call = calls.find((c) => c.id === id) ?? null;
      if (!call) return null;
      const ov = overrides[id];
      return ov ? { ...call, ...ov } : call;
    },
    [calls, overrides]
  );

  const effectiveCalls = useCallback((): EmergencyCall[] => {
    return calls.map((c) => {
      const ov = overrides[c.id];
      return ov ? { ...c, ...ov } : c;
    });
  }, [calls, overrides]);

  useEffect(() => {
    setCalls(getAllCalls());
  }, []);

  return { calls: effectiveCalls(), addCall, updateCall, getCall, refresh, isSavedCall };
}
