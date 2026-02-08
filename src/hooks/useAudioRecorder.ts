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

    // Queue for incoming audio to be played on unmute
    const playbackQueueRef = useRef<ArrayBuffer[]>([]);
    const isPlayingRef = useRef(false);

    const playNextInQueue = useCallback(async () => {
        if (playbackQueueRef.current.length === 0) {
            return;
        }

        isPlayingRef.current = true;
        const audioData = playbackQueueRef.current.shift();

        if (!audioData) return;

        return new Promise<void>((resolve) => {
            try {
                const blob = new Blob([audioData], { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);

                console.log(`🔊 Playing queued audio... (${playbackQueueRef.current.length} remaining)`);

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    // Recursively play next
                    playNextInQueue().then(resolve);
                };

                audio.onerror = (e) => {
                    console.error('Audio playback error', e);
                    resolve();
                };

                audio.play().catch(e => {
                    console.error('Play failed', e);
                    resolve();
                });
            } catch (e) {
                console.error('Error in playback chain', e);
                resolve();
            }
        });
    }, []);

    const startRecording = useCallback(async () => {
        try {
            if (isRecordingRef.current) return;

            // 1. Play queued audio first
            if (playbackQueueRef.current.length > 0) {
                console.log('⏳ Waiting for incoming audio to finish before recording...');
                await playNextInQueue();
                isPlayingRef.current = false;
            }

            // 2. Start Microphone
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
    }, [playNextInQueue]);

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

    // Audio Receiver Logic
    const handleAudioMessage = useCallback((data: { callSid: string; speaker: string; audio: ArrayBuffer }) => {
        // 🛡️ SECURITY: Only accept audio if it belongs to the CURRENT active call
        if (data.callSid !== callIdRef.current) return;
        if (data.speaker === role) return; // Ignore own voice

        console.log(`📥 Received audio from ${data.speaker}. Queueing...`);
        playbackQueueRef.current.push(data.audio);

        // If we are MUTED (not recording), maybe we should notify user?
        // But per request, we only play when they UNMUTE.
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


