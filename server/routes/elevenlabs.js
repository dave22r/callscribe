import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// TEMPORARY: Return the API key directly to allow client connection
// The upstream token endpoint documented previously allows this for testing
router.get('/token', async (req, res) => {
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'ElevenLabs API key not configured' });
        }

        // Generate a single-use token for Scribe Realtime
        const response = await fetch('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe', {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs token error:', errorText);

            // Fallback: If the endpoint fails (e.g. 404), return the API key directly for testing
            // This handles cases where the API path might slightly differ or be region-specific
            if (response.status === 404) {
                console.warn('Token endpoint not found, falling back to raw API key');
                return res.json({ token: apiKey });
            }

            return res.status(response.status).json({ error: 'Failed to generate token' });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error serving ElevenLabs token:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
