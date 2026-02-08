/**
 * Call store backed by localStorage.
 * Persists saved calls (from live transcription). Mock calls stay in memory.
 */
import type { EmergencyCall, TranscriptLine } from '@/data/mockCalls';
import { mockCalls } from '@/data/mockCalls';
import { parseTranscript, type ParsedTranscript } from './transcriptParser';

const STORAGE_KEY = 'ambulance-saved-calls';

function loadSavedCalls(): EmergencyCall[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed.map((c) => ({
      ...c,
      timestamp: new Date(c.timestamp as string),
      transcript: (c.transcript as TranscriptLine[]) ?? [],
    })) as EmergencyCall[];
  } catch {
    return [];
  }
}

function saveCalls(calls: EmergencyCall[]) {
  const toSave = calls.map((c) => ({
    ...c,
    timestamp: c.timestamp.toISOString(),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function getSavedCalls(): EmergencyCall[] {
  return loadSavedCalls();
}

export function getAllCalls(): EmergencyCall[] {
  const saved = loadSavedCalls();
  return [...mockCalls, ...saved];
}

export function addSavedCall(
  transcript: TranscriptLine[],
  parsed?: Partial<ParsedTranscript>
): EmergencyCall {
  const p = parsed ?? parseTranscript(transcript);
  const id = `saved-${Date.now()}`;
  const call: EmergencyCall = {
    id,
    callerName: 'Saved call',
    phone: 'N/A',
    location: p.location || 'N/A',
    urgency: p.urgency ?? 'stable',
    status: 'queued',
    summary: p.summary || transcript.map((t) => t.text).join(' ').slice(0, 150) + '...',
    symptoms: p.symptoms ?? [],
    patientType: p.patientType || 'N/A',
    confidence: p.confidence ?? 70,
    timestamp: new Date(),
    duration: 0,
    transcript,
  };
  const saved = loadSavedCalls();
  saved.unshift(call);
  saveCalls(saved);
  return call;
}

export function updateSavedCall(id: string, updates: Partial<EmergencyCall>): void {
  const saved = loadSavedCalls();
  const idx = saved.findIndex((c) => c.id === id);
  if (idx === -1) return;
  saved[idx] = { ...saved[idx], ...updates };
  saveCalls(saved);
}

export function isSavedCall(id: string): boolean {
  return id.startsWith('saved-');
}
