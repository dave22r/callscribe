import express from 'express';
import { getDB } from '../config/database.js';
import { analyzeCallTranscript } from '../services/gemini.js';

const router = express.Router();

/**
 * Get all calls from database
 */
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        if (!db) return res.json({ success: true, calls: [] });

        const calls = await db.collection('calls')
            .find({})
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        res.json({ success: true, calls });
    } catch (error) {
        console.error('Error fetching calls:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create a new call
 */
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const call = req.body;

        if (!call.callSid) {
            call.callSid = `call-${Date.now()}`;
        }

        // Ensure timestamp is a Date object if present, or set to now
        call.timestamp = call.timestamp ? new Date(call.timestamp) : new Date();

        await db.collection('calls').insertOne(call);

        // Emit new call event
        const io = req.app.get('io');
        io.emit('incoming-call', call);

        res.json({ success: true, call });
    } catch (error) {
        console.error('Error creating call:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get a specific call by ID
 */
router.get('/:callSid', async (req, res) => {
    try {
        const db = getDB();
        const call = await db.collection('calls').findOne({
            callSid: req.params.callSid
        });

        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        res.json({ success: true, call });
    } catch (error) {
        console.error('Error fetching call:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update call status (e.g., dispatcher accepted, ambulance dispatched)
 */
router.patch('/:callSid', async (req, res) => {
    try {
        const db = getDB();
        const { status, dispatchedAmbulance, notes } = req.body;

        // Create update object with only defined fields
        const updates = { updatedAt: new Date() };
        if (status) updates.status = status;
        if (dispatchedAmbulance) updates.dispatchedAmbulance = dispatchedAmbulance;
        if (notes) updates.notes = notes;

        // Allow updating any other fields passed in body (like transcript, analysis results)
        Object.assign(updates, req.body);
        delete updates.callSid; // Don't allow updating ID
        delete updates._id;

        const result = await db.collection('calls').updateOne(
            { callSid: req.params.callSid },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Call not found' });
        }

        // Emit update to connected clients
        const io = req.app.get('io');
        io.emit('call-updated', {
            callSid: req.params.callSid,
            ...updates
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating call:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Append a transcript line to a call
 */
router.post('/:callSid/transcript', async (req, res) => {
    try {
        const db = getDB();
        if (!db) return res.status(500).json({ error: 'Database not connected' });

        const { line, duration } = req.body;
        if (!line || !line.text) {
            return res.status(400).json({ error: 'Transcript line is required' });
        }

        const updateResult = await db.collection('calls').updateOne(
            { callSid: req.params.callSid },
            {
                $push: { transcript: line },
                $set: {
                    duration,
                    updatedAt: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: 'Call not found' });
        }

        // Fetch updated call to emit full state (optional, or just emit partial)
        // For efficiency, we can just emit what we have if we trust the client to append
        // But to match previous behavior of sending full transcript:
        const call = await db.collection('calls').findOne({ callSid: req.params.callSid });

        const io = req.app.get('io');
        io.emit('call-updated', {
            callSid: req.params.callSid,
            transcript: call.transcript,
            duration: call.duration,
            updatedAt: call.updatedAt
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error appending transcript:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Analyze call transcript with AI
 */
router.post('/analyze', async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        console.log('🤖 Analyzing transcript...');
        const result = await analyzeCallTranscript(transcript);

        if (!result.success) {
            console.error('❌ Analysis failed:', result.error);
            // Return success: false but with fallback analysis so UI doesn't break
            return res.json({ success: false, analysis: result.analysis });
        }

        console.log('✅ Analysis complete');
        res.json({ success: true, analysis: result.analysis });
    } catch (error) {
        console.error('Error analyzing call:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
