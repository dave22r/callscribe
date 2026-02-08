import { useState, useRef, useCallback, useEffect } from 'react';
import { socketService } from '@/services/socket';

interface AudioRecorderOptions {
    role: 'caller' | 'operator';
    callIdRef: React.MutableRefObject<string | null>;
}

export function useAudioRecorder({ role, callIdRef }: AudioRecorderOptions) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isRecordingRef = useRef(false);

    const startRecording = useCallback(async () => {
        try {
            if (isRecordingRef.current) return;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            isRecordingRef.current = true;
            console.log('🎤 Audio recording started');

        } catch (error) {
            console.error('❌ Failed to start audio recording:', error);
        }
    }, []);

    const stopRecording = useCallback((callSid: string | null) => {
        if (!mediaRecorderRef.current || !isRecordingRef.current) return;

        const recorder = mediaRecorderRef.current;

        recorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log(`🎤 Audio recording stopped. Size: ${audioBlob.size} bytes`);

            if (callSid && audioBlob.size > 0) {
                // Convert Blob to ArrayBuffer to send over socket
                const reader = new FileReader();
                reader.readAsArrayBuffer(audioBlob);
                reader.onloadend = () => {
                    const buffer = reader.result;
                    socketService.emit('audio-message', {
                        callSid,
                        speaker: role,
                        audio: buffer
                    });
                    console.log('📤 Audio message sent');
                };
            }

            // Stop all tracks to release mic
            try {
                recorder.stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.warn('Error stopping tracks', e);
            }
        };

        recorder.stop();
        isRecordingRef.current = false;
        mediaRecorderRef.current = null;
    }, [role]);

    // Audio Playback Logic
    const handleAudioMessage = useCallback((data: { callSid: string; speaker: string; audio: ArrayBuffer }) => {
        // 🛡️ SECURITY: Only play audio if it belongs to the CURRENT active call
        if (data.callSid !== callIdRef.current) {
            // console.log(`🔇 Ignoring audio from other call: ${data.callSid} (Active: ${callIdRef.current})`);
            return;
        }

        if (data.speaker === role) return; // Don't play own voice

        try {
            const blob = new Blob([data.audio], { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            console.log(`🔊 Playing audio from ${data.speaker}`);
            audio.play().catch(err => console.error('Error playing audio:', err));

            audio.onended = () => {
                URL.revokeObjectURL(url);
            };
        } catch (error) {
            console.error('Error handling audio message:', error);
        }
    }, [role, callIdRef]);

    // Subscribe to socket events
    useEffect(() => {
        socketService.on('audio-message', handleAudioMessage);
        return () => {
            socketService.off('audio-message', handleAudioMessage);
        };
    }, [handleAudioMessage]);

    return {
        startRecording,
        stopRecording
    };
}

