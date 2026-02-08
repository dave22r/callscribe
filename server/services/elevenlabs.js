import fetch from 'node-fetch';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Transcribe audio using ElevenLabs Speech-to-Text
 * Note: ElevenLabs primarily focuses on TTS. For STT, we'll use their API if available,
 * or integrate with a dedicated STT service like Deepgram or AssemblyAI
 */
export const transcribeAudio = async (audioBuffer) => {
    try {
        // For hackathon: Using a placeholder implementation
        // In production, integrate with Deepgram, AssemblyAI, or Google Speech-to-Text
        console.log('📝 Transcribing audio...');

        // TODO: Implement actual STT integration
        // For now, return a mock response to keep the pipeline working
        return {
            success: true,
            transcript: 'Audio transcription will be implemented with STT service',
            confidence: 0.95
        };
    } catch (error) {
        console.error('Transcription error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generate speech from text using ElevenLabs TTS
 * This can be used for AI voice prompts to guide dispatchers
 */
export const textToSpeech = async (text, voiceId = 'default') => {
    try {
        if (!ELEVENLABS_API_KEY) {
            throw new Error('ElevenLabs API key not configured');
        }

        const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.statusText}`);
        }

        const audioBuffer = await response.arrayBuffer();

        return {
            success: true,
            audio: Buffer.from(audioBuffer)
        };
    } catch (error) {
        console.error('Text-to-speech error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
