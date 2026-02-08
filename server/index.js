import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import twilioRoutes from './routes/twilio.js';
import callsRouter from './routes/calls.js';
import elevenLabsRouter from './routes/elevenlabs.js';
import { connectDB } from './config/database.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:8080'],
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/twilio', twilioRoutes);
app.use('/api/calls', callsRouter);
app.use('/api/elevenlabs', elevenLabsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'CallScribe API is running' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('call-partial', (payload) => {
        // Forward partial transcript to other clients in real-time
        socket.broadcast.emit('call-partial', payload);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`🚀 CallScribe API server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});

export { io };
