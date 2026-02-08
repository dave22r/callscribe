import { useState, useCallback, useEffect } from 'react';
import { callsApi } from '@/services/api';
import { mockCalls, type EmergencyCall, type TranscriptLine } from '@/data/mockCalls';
import { socketService } from '@/services/socket';

export function useCalls() {
    const [calls, setCalls] = useState<EmergencyCall[]>([]);
    const [loading, setLoading] = useState(true);
    const [partials, setPartials] = useState<Record<string, TranscriptLine | null>>({});

    const fetchCalls = useCallback(async () => {
        try {
            const apiCalls = await callsApi.getAllCalls();

            const formattedCalls = apiCalls.map(c => ({
                ...c,
                id: c.callSid || c.id,
                timestamp: new Date(c.timestamp),
                callerName: c.callerName || c.from || 'Unknown',
                phone: c.from || 'Unknown',
                location: c.location || 'Unknown',
                urgency: (c.status === 'critical' || c.status === 'urgent' || c.status === 'stable') ? c.status : (c.urgency || 'stable'),
                status: c.status as any,
                summary: c.notes || c.summary || '',
                symptoms: c.symptoms || [],
                transcript: c.transcript || [],
                patientType: c.patientType || 'Unknown',
                confidence: c.confidence || 0,
                duration: c.duration || 0,
                tags: c.tags || []
            })) as EmergencyCall[];

            const mockIds = new Set(mockCalls.map(c => c.id));
            const newCalls = formattedCalls.filter(c => !mockIds.has(c.id));

            setCalls([...mockCalls, ...newCalls]);
        } catch (e) {
            console.error("Failed to fetch calls", e);
            setCalls(mockCalls);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCalls();

        // Ensure socket is connected for real-time updates
        socketService.connect();

        const handleUpdate = (updatedCall: any) => {
            setCalls(prev => prev.map(c => c.id === updatedCall.callSid ? { ...c, ...updatedCall } : c));
        };

        const handleIncoming = (newCall: any) => {
            fetchCalls();
        };

        const handlePartial = (payload: any) => {
            if (!payload?.callSid || !payload?.speaker) return;

            const text = typeof payload.text === 'string' ? payload.text : '';
            if (!text.trim()) {
                setPartials(prev => ({ ...prev, [payload.callSid]: null }));
                return;
            }

            setPartials(prev => ({
                ...prev,
                [payload.callSid]: {
                    speaker: payload.speaker,
                    text,
                    timestamp: '--:--'
                }
            }));
        };

        socketService.on('call-updated', handleUpdate);
        socketService.on('incoming-call', handleIncoming);
        socketService.on('call-partial', handlePartial);

        return () => {
            socketService.off('call-updated', handleUpdate);
            socketService.off('incoming-call', handleIncoming);
            socketService.off('call-partial', handlePartial);
        };
    }, [fetchCalls]);

    const addCall = useCallback((transcript: TranscriptLine[]) => {
        const id = `call-${Date.now()}`;
        const newCall: EmergencyCall = {
            id,
            callSid: id,
            callerName: 'New Caller',
            phone: 'Unknown',
            location: 'Unknown',
            urgency: 'stable',
            status: 'queued',
            summary: 'New call started',
            symptoms: [],
            patientType: 'Unknown',
            confidence: 0,
            timestamp: new Date(),
            duration: 0,
            transcript,
            tags: []
        };

        // Optimistic update
        setCalls(prev => [newCall, ...prev]);

        // Sync to backend
        callsApi.createCall(newCall).catch(e => {
            console.error("Failed to persist new call", e);
        });

        return newCall;
    }, []);

    const updateCall = useCallback(async (id: string, updates: Partial<EmergencyCall>) => {
        // Optimistic update
        setCalls(prevCalls =>
            prevCalls.map(call =>
                call.id === id ? { ...call, ...updates } : call
            )
        );

        // Backend update
        try {
            await callsApi.updateCall(id, updates);
        } catch (error) {
            console.error("Failed to update call", error);
        }
    }, []);

    const getCall = useCallback((id: string | null) => {
        return calls.find(c => c.id === id) || null;
    }, [calls]);

    const getPartial = useCallback((id: string | null) => {
        if (!id) return null;
        return partials[id] || null;
    }, [partials]);

    return {
        calls,
        loading,
        addCall,
        updateCall,
        getCall,
        getPartial
    };
}
