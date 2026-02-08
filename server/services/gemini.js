import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const getAIProvider = () => process.env.AI_PROVIDER || 'gemini';

// Lazy initialization - create clients when needed
let genAI = null;
let openrouter = null;

const getGeminiClient = () => {
    if (!genAI && process.env.VITE_GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    }
    return genAI;
};

const getOpenRouterClient = () => {
    if (!openrouter && process.env.OPENROUTER_API_KEY) {
        openrouter = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
        });
    }
    return openrouter;
};

const analyzeWithGemini = async (prompt) => {
    const client = getGeminiClient();
    if (!client) {
        throw new Error('Gemini API key not configured');
    }

    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

const analyzeWithOpenRouter = async (prompt) => {
    const client = getOpenRouterClient();
    if (!client) {
        throw new Error('OpenRouter API key not configured');
    }

    const completion = await client.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    return completion.choices[0].message.content;
};



const analyzeWithFeatherless = async (prompt) => {
    if (!process.env.FEATHERLESS_API_KEY) {
        throw new Error('Featherless API key not configured');
    }

    const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.FEATHERLESS_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'zai-org/GLM-4.6',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Featherless API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

const analyzeWithAI = async (prompt) => {
    const provider = getAIProvider();
    const shouldUseOpenRouter = provider === 'openrouter' || !process.env.VITE_GEMINI_API_KEY;

    console.log(`🤖 Using AI provider: ${shouldUseOpenRouter ? 'openrouter' : 'gemini'}`);

    if (shouldUseOpenRouter) {
        return await analyzeWithOpenRouter(prompt);
    } else {
        return await analyzeWithGemini(prompt);
    }
};

export const calculateBestETA = async (patientLocation, ambulances) => {
    try {
        const availableAmbulances = ambulances.filter(a => a.status === 'available');

        if (availableAmbulances.length === 0) {
            return {
                recommendedAmbulanceId: null,
                etaMinutes: null,
                reasoning: "No available ambulances."
            };
        }

        const ambulanceLocations = availableAmbulances.map(a => ({
            id: a.id,
            unit: a.unit,
            location: a.location
        }));

        const prompt = `
        Patient Location: "${patientLocation}"
        
        Available Ambulances:
        ${JSON.stringify(ambulanceLocations, null, 2)}
        
        Task:
        1. Identify which ambulance is closest to the patient in Vancouver, BC.
        2. Estimate the driving time in minutes considering urban traffic.
        3. Recommend that ambulance.
        
        Respond ONLY with valid JSON in this format:
        {
            "recommendedAmbulanceId": "string (id from list)",
            "etaMinutes": number (integer minutes),
            "reasoning": "brief explanation"
        }
        `;

        let text;
        try {
            console.log('🦅 Requesting ETA from Featherless (GLM-4.6)...');
            text = await analyzeWithFeatherless(prompt);
            console.log('🦅 Featherless response received');
        } catch (featherlessError) {
            console.warn('⚠️ Featherless ETA failed, falling back to OpenRouter:', featherlessError.message);
            text = await analyzeWithAI(prompt);
        }

        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('AI ETA error:', error);
        // Fallback: pick first available
        const fallback = ambulances.find(a => a.status === 'available');
        return {
            recommendedAmbulanceId: fallback ? fallback.id : null,
            etaMinutes: 15, // Conservative fallback
            reasoning: "AI calculation failed, selecting first available."
        };
    }
};

export const analyzeCallTranscript = async (transcript) => {
    try {
        const prompt = `You are an AI emergency medical dispatcher assistant. Analyze this emergency call transcript and provide a structured assessment.

Transcript:
${transcript}

Provide your analysis in the following JSON format:
{
  "urgency": "critical" | "urgent" | "stable",
  "confidence": <number 0-100>,
  "symptoms": [<array of detected symptoms>],
  "patientName": "<name if mentioned, otherwise 'Unknown'>",
  "patientType": "<age and gender if mentioned, e.g., 'Adult (58M)' or 'Unknown'>",
  "location": "<address or location if mentioned, otherwise 'Unknown'>",
  "summary": "<brief 1-2 sentence summary of the emergency>",
  "keywords": [<critical words/phrases that indicate urgency>],
  "recommendedActions": [<array of immediate actions for dispatcher>]
}

Be concise and focus on life-threatening indicators. Only respond with valid JSON.`;

        const text = await analyzeWithAI(prompt);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        return {
            success: true,
            analysis
        };
    } catch (error) {
        console.error('AI API error:', error);
        return {
            success: false,
            error: error.message,
            analysis: {
                urgency: 'urgent',
                confidence: 50,
                symptoms: ['Unknown'],
                patientType: 'Unknown',
                summary: 'Unable to analyze call. Manual review required.',
                keywords: [],
                recommendedActions: ['Manual dispatcher review required']
            }
        };
    }
};

export const analyzePartialTranscript = async (partialTranscript) => {
    try {
        const prompt = `Analyze this partial emergency call transcript. Extract any critical information detected so far.

Partial Transcript:
${partialTranscript}

Respond with JSON:
{
  "detectedSymptoms": [<symptoms mentioned so far>],
  "urgencyIndicators": [<urgent keywords/phrases>],
  "preliminaryUrgency": "critical" | "urgent" | "stable" | "unknown"
}

Only respond with valid JSON.`;

        const text = await analyzeWithAI(prompt);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { detectedSymptoms: [], urgencyIndicators: [], preliminaryUrgency: 'unknown' };
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('AI partial analysis error:', error);
        return { detectedSymptoms: [], urgencyIndicators: [], preliminaryUrgency: 'unknown' };
    }
};
