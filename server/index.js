/**
 * Minimal backend for CallScribe: provides a single-use ElevenLabs token
 * so the frontend can use Scribe Realtime without exposing the API key.
 *
 * Set ELEVENLABS_API_KEY in .env and run: node server/index.js
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/scribe-token', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'ELEVENLABS_API_KEY is not set. Add it to .env and restart the server.',
    });
    return;
  }

  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('ElevenLabs token error:', response.status, text);
      res.status(response.status).json({
        error: 'Failed to create token',
        details: text,
      });
      return;
    }

    const data = await response.json();
    res.json({ token: data.token });
  } catch (err) {
    console.error('Token request failed:', err);
    res.status(500).json({ error: err.message ?? 'Token request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`CallScribe token server running at http://localhost:${PORT}`);
  console.log('  GET /scribe-token → single-use ElevenLabs Scribe token');
});
