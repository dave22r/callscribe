import express from 'express';
import { getDB } from '../config/database.js';

const router = express.Router();

/**
 * Get all calls from database
 */
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }

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
 * Get a specific call by ID
 */
router.get('/:callSid', async (req, res) => {
    try {
        const db = getDB();
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }

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
        if (!db) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { status, dispatchedAmbulance, notes } = req.body;

        const result = await db.collection('calls').updateOne(
            { callSid: req.params.callSid },
            {
                $set: {
                    status,
                    dispatchedAmbulance,
                    notes,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Call not found' });
        }

        // Emit update to connected clients
        const io = req.app.get('io');
        io.emit('call-updated', {
            callSid: req.params.callSid,
            status,
            dispatchedAmbulance
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating call:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
