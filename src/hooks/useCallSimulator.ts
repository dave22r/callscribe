import { useState, useCallback, useRef } from 'react';
import { useScribe, CommitStrategy } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import type { TranscriptLine, UrgencyLevel } from '@/data/mockCalls';

export interface SimulationState {
  isActive: boolean;
  callId: string | null;
  transcript: TranscriptLine[];
  analysis: {
    urgency: UrgencyLevel;
    confidence: number;
    symptoms: string[];
    patientType: string;
    summary: string;
    keywords: string[];
  } | null;
  isAiResponding: boolean;
  isAiSpeaking: boolean;
  error: string | null;
}

const initialState: SimulationState = {
  isActive: false,
  callId: null,
  transcript: [],
  analysis: null,
  isAiResponding: false,
  isAiSpeaking: false,
  error: null,
};

export function useCallSimulator() {
  const [state, setState] = useState<SimulationState>(initialState);
  const messagesRef = useRef<{ role: string; content: string }[]>([]);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isActiveRef = useRef(false);

  const getTimestamp = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const addTranscriptLine = useCallback((line: TranscriptLine) => {
    setState(prev => ({
      ...prev,
      transcript: [...prev.transcript, line],
    }));
  }, []);

  const speakResponse = useCallback(async (text: string) => {
    try {
      setState(prev => ({ ...prev, isAiSpeaking: true }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) throw new Error("TTS failed");

      const data = await response.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setState(prev => ({ ...prev, isAiSpeaking: false }));
      audio.onerror = () => setState(prev => ({ ...prev, isAiSpeaking: false }));
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setState(prev => ({ ...prev, isAiSpeaking: false }));
    }
  }, []);

  const getAiResponse = useCallback(async (userText: string) => {
    setState(prev => ({ ...prev, isAiResponding: true }));
    messagesRef.current.push({ role: "user", content: userText });

    try {
      const { data, error } = await supabase.functions.invoke("ai-triage", {
        body: { messages: messagesRef.current },
      });

      if (error) throw error;

      const aiText = data.response || "I understand. Can you tell me more about the situation?";
      messagesRef.current.push({ role: "assistant", content: aiText });

      addTranscriptLine({
        speaker: 'operator',
        text: aiText,
        timestamp: getTimestamp(),
        keywords: data.analysis?.keywords,
      });

      if (data.analysis) {
        setState(prev => ({ ...prev, analysis: data.analysis }));
      }

      setState(prev => ({ ...prev, isAiResponding: false }));

      speakResponse(aiText);
    } catch (err) {
      console.error("AI triage error:", err);
      setState(prev => ({
        ...prev,
        isAiResponding: false,
        error: "AI response failed. Please try again.",
      }));
    }
  }, [addTranscriptLine, speakResponse]);

  const handleCommittedTranscript = useCallback((data: { text: string }) => {
    if (!isActiveRef.current || !data.text.trim()) return;

    const userText = data.text.trim();
    addTranscriptLine({
      speaker: 'caller',
      text: userText,
      timestamp: getTimestamp(),
    });

    getAiResponse(userText);
  }, [addTranscriptLine, getAiResponse]);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onCommittedTranscript: handleCommittedTranscript,
  });

  const startSimulation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (error || !data?.token) {
        throw new Error(error?.message || "Failed to get transcription token");
      }

      const callId = `sim-${Date.now()}`;
      startTimeRef.current = Date.now();
      messagesRef.current = [];
      isActiveRef.current = true;

      setState({
        isActive: true,
        callId,
        transcript: [],
        analysis: null,
        isAiResponding: false,
        isAiSpeaking: false,
        error: null,
      });

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const greeting = "Emergency services, what is your emergency?";
      addTranscriptLine({
        speaker: 'operator',
        text: greeting,
        timestamp: '00:00',
      });
      messagesRef.current.push({ role: "assistant", content: greeting });
      speakResponse(greeting);

    } catch (err) {
      console.error("Failed to start simulation:", err);
      isActiveRef.current = false;
      setState(prev => ({
        ...prev,
        isActive: false,
        error: err instanceof Error ? err.message : "Failed to start call simulation",
      }));
    }
  }, [scribe, addTranscriptLine, speakResponse]);

  const stopSimulation = useCallback(() => {
    isActiveRef.current = false;
    scribe.disconnect();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState(prev => ({ ...prev, isActive: false, isAiSpeaking: false }));
  }, [scribe]);

  return {
    state,
    scribe,
    startSimulation,
    stopSimulation,
  };
}
