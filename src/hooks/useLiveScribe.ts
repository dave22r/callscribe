import { useState, useCallback, useRef } from 'react';
import { useScribe } from '@elevenlabs/react';
import type { TranscriptLine } from '@/data/mockCalls';
import { callsApi } from '@/services/api';
import { socketService } from '@/services/socket';

function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type SpeakerRole = 'caller' | 'operator';

type UseLiveScribeOptions = {
    fixedRole?: SpeakerRole;
};

type StartOptions = {
    callId?: string;
    reset?: boolean;
};

/**
 * Hook for live transcription via ElevenLabs Scribe Realtime.
 * Persists to Backend API.
 */
export function useLiveScribe(options: UseLiveScribeOptions = {}) {
    const role: SpeakerRole = options.fixedRole ?? 'caller';

    const [lines, setLines] = useState<TranscriptLine[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [partialText, setPartialText] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const activeCallId = useRef<string | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const lastPartialEmitAtRef = useRef(0);
    const lastPartialTextRef = useRef('');
    const lastManualCommitRef = useRef('');

    const emitPartial = useCallback((text: string) => {
        const callSid = activeCallId.current;
        if (!callSid) return;

        const nextText = text ?? '';
        if (nextText === lastPartialTextRef.current) return;

        const now = Date.now();
        if (now - lastPartialEmitAtRef.current < 150) return;

        lastPartialEmitAtRef.current = now;
        lastPartialTextRef.current = nextText;

        socketService.emit('call-partial', {
            callSid,
            speaker: role,
            text: nextText
        });
    }, [role]);

    const scribe = useScribe({
        onError: (err) => {
            console.error('❌ ElevenLabs Error:', err);
            setTokenError(typeof err === 'string' ? err : 'Connection failed');
        },
        modelId: 'scribe_v2_realtime',
        onPartialTranscript: (data) => {
            if (data?.text) {
                setPartialText(data.text);
                emitPartial(data.text);
            }
        },
        onCommittedTranscript: async (data: { text: string }) => {
            const committedText = data.text?.trim();
            if (!committedText) return;

            if (lastManualCommitRef.current && committedText === lastManualCommitRef.current) {
                lastManualCommitRef.current = '';
                setPartialText('');
                return;
            }

            const elapsed = startTimeRef.current != null ? (Date.now() - startTimeRef.current) / 1000 : 0;
            const newLine: TranscriptLine = {
                speaker: role,
                text: committedText,
                timestamp: formatTimestamp(elapsed),
            };

            setLines((prev) => [...prev, newLine]);
            setPartialText('');
            emitPartial('');

            if (activeCallId.current) {
                callsApi.appendTranscriptLine(activeCallId.current, newLine, Math.ceil(elapsed))
                    .catch(e => console.error('Failed to sync transcript line', e));
            }
        },
    });

    const commitPartial = useCallback(() => {
        const text = partialText.trim();
        if (!text) return;

        const elapsed = startTimeRef.current != null ? (Date.now() - startTimeRef.current) / 1000 : 0;
        const newLine: TranscriptLine = {
            speaker: role,
            text,
            timestamp: formatTimestamp(elapsed),
        };

        lastManualCommitRef.current = text;
        setLines((prev) => [...prev, newLine]);
        setPartialText('');
        emitPartial('');

        if (activeCallId.current) {
            callsApi.appendTranscriptLine(activeCallId.current, newLine, Math.ceil(elapsed))
                .catch(e => console.error('Failed to sync transcript line', e));
        }
    }, [emitPartial, partialText, role]);

    const resolveStartTime = useCallback(async (callId: string | null) => {
        if (startTimeRef.current != null) return startTimeRef.current;

        if (callId) {
            try {
                const call = await callsApi.getCall(callId);
                if (call?.timestamp) {
                    const ts = new Date(call.timestamp).getTime();
                    startTimeRef.current = ts;
                    setStartTime(ts);
                    return ts;
                }
            } catch (error) {
                console.warn('Failed to fetch call start time', error);
            }
        }

        const now = Date.now();
        startTimeRef.current = now;
        setStartTime(now);
        return now;
    }, []);

    const connectMic = useCallback(async () => {
        if (scribe.isConnected) return;

        setIsConnecting(true);
        setTokenError(null);

        try {
            const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
            const tokenResponse = await fetch(`${API_URL}/api/elevenlabs/token`);
            if (!tokenResponse.ok) {
                throw new Error('Failed to fetch access token');
            }

            const { token } = await tokenResponse.json();

            await scribe.connect({
                token,
                microphone: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Could not connect to Scribe';
            console.error('❌ Scribe connection error:', e);
            setTokenError(message);
        } finally {
            setIsConnecting(false);
        }
    }, [scribe]);

    const start = useCallback(async ({ callId, reset }: StartOptions = {}) => {
        if (reset) {
            setLines([]);
            setPartialText('');
            startTimeRef.current = null;
            setStartTime(null);
            lastPartialTextRef.current = '';
            lastPartialEmitAtRef.current = 0;
            lastManualCommitRef.current = '';
        }

        if (callId) {
            activeCallId.current = callId;
            // Fetch existing transcript to prevent wiping history
            try {
                const call = await callsApi.getCall(callId);
                if (call?.transcript) {
                    setLines(call.transcript);
                }
            } catch (e) {
                console.error('Failed to sync existing transcript', e);
            }
        } else if (!activeCallId.current || reset) {
            const now = Date.now();
            const initialCall = {
                from: 'Live Caller',
                status: 'active',
                timestamp: new Date(now),
                transcript: [],
                callerName: 'Live Caller',
                location: 'Detecting...'
            };

            const createdCall = await callsApi.createCall(initialCall);
            if (createdCall?.callSid) {
                activeCallId.current = createdCall.callSid;
            }
        }

        await resolveStartTime(activeCallId.current);
        await connectMic();
    }, [connectMic, resolveStartTime]);

    const unmute = useCallback(async (callId?: string) => {
        await start({ callId });
    }, [start]);

    const mute = useCallback(() => {
        commitPartial();
        emitPartial('');
        scribe.disconnect();
        setPartialText('');
    }, [commitPartial, emitPartial, scribe]);

    const stop = useCallback(async () => {
        mute();

        if (activeCallId.current) {
            await callsApi.updateCall(activeCallId.current, {
                status: 'processing'
            });
        }

        activeCallId.current = null;
        startTimeRef.current = null;
        setStartTime(null);
    }, [mute]);

    return {
        transcript: lines,
        partialTranscript: partialText,
        isConnected: scribe.isConnected ?? false,
        isConnecting,
        error: tokenError,
        role,
        start,
        stop,
        mute,
        unmute,
        activeCallId: activeCallId.current,
        startTime,
    };
}
