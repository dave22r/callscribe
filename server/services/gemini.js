import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

export const analyzeCallTranscript = async (transcript) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are an AI emergency medical dispatcher assistant. Analyze this emergency call transcript and provide a structured assessment.

Transcript:
${transcript}

Provide your analysis in the following JSON format:
{
  "urgency": "critical" | "urgent" | "stable",
  "confidence": <number 0-100>,
  "symptoms": [<array of detected symptoms>],
  "patientType": "<age and gender if mentioned, e.g., 'Adult (58M)' or 'Unknown'>",
  "summary": "<brief 1-2 sentence summary of the emergency>",
  "keywords": [<critical words/phrases that indicate urgency>],
  "recommendedActions": [<array of immediate actions for dispatcher>]
}

Be concise and focus on life-threatening indicators. Only respond with valid JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in Gemini response');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        return {
            success: true,
            analysis
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        return {
            success: false,
            error: error.message,
            // Fallback analysis
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
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { detectedSymptoms: [], urgencyIndicators: [], preliminaryUrgency: 'unknown' };
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Gemini partial analysis error:', error);
        return { detectedSymptoms: [], urgencyIndicators: [], preliminaryUrgency: 'unknown' };
    }
};
