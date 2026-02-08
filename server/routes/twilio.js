import express from 'express';
import twilio from 'twilio';
import { getDB } from '../config/database.js';
import { analyzeCallTranscript, analyzePartialTranscript } from '../services/gemini.js';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Twilio webhook for incoming calls
 * This endpoint is called when someone dials your Twilio number
 */
router.post('/incoming-call', async (req, res) => {
    const twiml = new VoiceResponse();
    const { CallSid, From, To } = req.body;

    console.log(`📞 Incoming call: ${CallSid} from ${From}`);

    // Emit event to connected clients via Socket.io
    const io = req.app.get('io');
    io.emit('incoming-call', {
        callSid: CallSid,
        from: From,
        to: To,
        timestamp: new Date()
    });

    // Greet the caller
    twiml.say({ voice: 'alice' }, 'Emergency services. Your call is being recorded and analyzed. Please describe your emergency.');

    // Start recording and transcription
    twiml.record({
        transcribe: true,
        transcribeCallback: '/api/twilio/transcription',
        action: '/api/twilio/recording-complete',
        maxLength: 300, // 5 minutes max
        playBeep: false
    });

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Twilio transcription callback
 * Called when Twilio completes transcription of the call
 */
router.post('/transcription', async (req, res) => {
    const { CallSid, TranscriptionText, TranscriptionStatus } = req.body;

    console.log(`📝 Transcription received for ${CallSid}`);

    if (TranscriptionStatus === 'completed' && TranscriptionText) {
        // Analyze with Gemini
        const analysis = await analyzeCallTranscript(TranscriptionText);

        // Save to database
        const db = getDB();
        if (db) {
            try {
                await db.collection('calls').insertOne({
                    callSid: CallSid,
                    transcript: TranscriptionText,
                    analysis: analysis.analysis,
                    timestamp: new Date(),
                    status: 'analyzed'
                });
            } catch (error) {
                console.error('Database save error:', error);
            }
        }

        // Emit to connected clients
        const io = req.app.get('io');
        io.emit('call-analyzed', {
            callSid: CallSid,
            transcript: TranscriptionText,
            analysis: analysis.analysis
        });
    }

    res.sendStatus(200);
});

/**
 * Recording complete callback
 */
router.post('/recording-complete', (req, res) => {
    const { CallSid, RecordingUrl } = req.body;

    console.log(`🎙️  Recording complete for ${CallSid}: ${RecordingUrl}`);

    const io = req.app.get('io');
    io.emit('recording-complete', {
        callSid: CallSid,
        recordingUrl: RecordingUrl
    });

    const twiml = new VoiceResponse();
    twiml.say({ voice: 'alice' }, 'Thank you. Help is on the way. Stay on the line if you need further assistance.');
    twiml.pause({ length: 2 });
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Call status callback
 * Tracks call lifecycle events
 */
router.post('/status', (req, res) => {
    const { CallSid, CallStatus } = req.body;

    console.log(`📊 Call ${CallSid} status: ${CallStatus}`);

    const io = req.app.get('io');
    io.emit('call-status', {
        callSid: CallSid,
        status: CallStatus,
        timestamp: new Date()
    });

    res.sendStatus(200);
});

export default router;
