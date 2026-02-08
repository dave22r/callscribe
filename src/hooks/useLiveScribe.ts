import { useState, useCallback, useRef } from 'react';
import { useScribe } from '@elevenlabs/react';
import type { TranscriptLine } from '@/data/mockCalls';
import { callsApi } from '@/services/api';

// ElevenLabs API key - in production, this should be in env vars
const ELEVENLABS_API_KEY = 'sk_b5708d8eee626b81e344cb51d107fd7f447376484c4fec47';

function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Hook for live transcription via ElevenLabs Scribe Realtime.
 * Persists to Backend API.
 */
export function useLiveScribe() {
    const [lines, setLines] = useState<TranscriptLine[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [currentSpeaker, setCurrentSpeaker] = useState<'caller' | 'operator'>('caller');
    const currentSpeakerRef = useRef<'caller' | 'operator'>('caller');
    const [partialText, setPartialText] = useState('');

    // Track the active call ID relative to the backend
    const activeCallId = useRef<string | null>(null);

    const scribe = useScribe({
        onWebsocketOpen: () => {
            console.log('✅ ElevenLabs WebSocket Connected');
        },
        onWebsocketClose: () => {
            console.log('❌ ElevenLabs WebSocket Closed');
        },
        onError: (err) => {
            console.error('❌ ElevenLabs Error:', err);
            setTokenError(typeof err === 'string' ? err : 'Connection failed');
        },
        modelId: 'scribe_v2_realtime',
        onPartialTranscript: (data) => {
            if (data?.text) {
                setPartialText(data.text);
            }
        },
        onCommittedTranscript: async (data: { text: string }) => {
            if (!data.text?.trim()) return;

            console.log('📝 Processing commit. Current Ref Speaker:', currentSpeakerRef.current);

            const elapsed = startTime != null ? (Date.now() - startTime) / 1000 : 0;
            const newLine: TranscriptLine = {
                speaker: currentSpeakerRef.current, // Use ref to avoid stale closure
                text: data.text.trim(),
                timestamp: formatTimestamp(elapsed),
            };

            setLines((prev) => {
                const newLines = [...prev, newLine];

                // Sync to backend if we have a call ID
                if (activeCallId.current) {
                    callsApi.updateCall(activeCallId.current, {
                        transcript: newLines,
                        duration: Math.ceil(elapsed) // Update duration too
                    }).catch(e => console.error("Failed to sync transcript", e));
                }

                return newLines;
            });
            setPartialText('');
        },
    });

    const start = useCallback(async (existingCallId?: string) => {
        console.log('🎤 Starting ElevenLabs Scribe transcription...');
        setTokenError(null);
        setLines([]);
        setPartialText('');
        const now = Date.now();
        setStartTime(now);

        // Reset speaker
        console.log('🔄 Resetting speaker to caller');
        setCurrentSpeaker('caller');
        currentSpeakerRef.current = 'caller';

        // Use existing ID if provided, otherwise null (will create new)
        activeCallId.current = existingCallId || null;

        try {
            if (!activeCallId.current) {
                // 1. Create call in backend if no ID provided
                const initialCall = {
                    from: 'Live Caller',
                    status: 'active',
                    timestamp: new Date(now),
                    transcript: [],
                    callerName: 'Live Caller',
                    location: 'Detecting...'
                };

                console.log('Creating backend call record...');
                const createdCall = await callsApi.createCall(initialCall);

                if (createdCall && createdCall.callSid) {
                    activeCallId.current = createdCall.callSid;
                    console.log('✅ Backend call created:', createdCall.callSid);
                } else {
                    console.error('⚠️ Failed to create backend call, running in offline mode');
                }
            } else {
                console.log('✅ Using existing active call:', activeCallId.current);
            }

            // 2. Fetch ephemeral token from backend
            console.log('🔑 Fetching access token...');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const tokenResponse = await fetch(`${API_URL}/api/elevenlabs/token`);
            if (!tokenResponse.ok) {
                throw new Error('Failed to fetch access token');
            }
            const { token } = await tokenResponse.json();

            // 3. Connect to ElevenLabs
            console.log('🔌 Connecting to ElevenLabs Scribe...');
            await scribe.connect({
                token,
                microphone: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            console.log('✅ Connected to ElevenLabs Scribe! Listening for speech...');
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Could not connect to Scribe';
            console.error('❌ Scribe connection error:', e);
            setTokenError(message);
        }
    }, [scribe]);

    const stop = useCallback(async () => {
        scribe.disconnect();

        // Finalize call in backend
        if (activeCallId.current) {
            await callsApi.updateCall(activeCallId.current, {
                status: 'processing' // Trigger AI analysis if backend is set up to watch this
            });
        }
    }, [scribe]);

    const toggleSpeaker = useCallback(() => {
        setCurrentSpeaker(prev => {
            const next = prev === 'caller' ? 'operator' : 'caller';
            console.log('🔀 Toggling speaker to:', next);
            currentSpeakerRef.current = next; // Update ref immediately
            return next;
        });
    }, []);

    return {
        transcript: lines,
        partialTranscript: partialText || (scribe.partialTranscript ?? ''),
        isConnected: scribe.isConnected ?? false,
        error: tokenError,
        currentSpeaker,
        start,
        stop,
        toggleSpeaker,
        activeCallId: activeCallId.current
    };
}
