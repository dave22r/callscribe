import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import twilioRoutes from './routes/twilio.js';
import callsRouter from './routes/calls.js';
import elevenLabsRouter from './routes/elevenlabs.js';
import { connectDB } from './config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

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

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('call-partial', (payload) => {
        // Forward partial transcript to other clients in real-time
        socket.broadcast.emit('call-partial', payload);
    });

    socket.on('audio-message', (payload) => {
        // Broadcast audio chunk/blob to other clients
        // CONVERT WebM -> MP4 for iOS support
        import('fluent-ffmpeg').then(({ default: ffmpeg }) => {
            import('fs').then(({ default: fs }) => {
                import('path').then(({ default: path }) => {
                    import('os').then(({ default: os }) => {

                        const tempDir = path.join(os.tmpdir(), 'callscribe-audio');
                        if (!fs.existsSync(tempDir)) {
                            fs.mkdirSync(tempDir, { recursive: true });
                        }

                        const timestamp = Date.now();
                        const inputPath = path.join(tempDir, `input-${timestamp}-${socket.id}.webm`);
                        const outputPath = path.join(tempDir, `output-${timestamp}-${socket.id}.mp4`);

                        // Write input buffer
                        fs.writeFile(inputPath, Buffer.from(payload.audio), (err) => {
                            if (err) {
                                console.error('❌ Failed to write temp audio file:', err);
                                return;
                            }

                            // Convert using ffmpeg
                            ffmpeg(inputPath)
                                .toFormat('mp4')
                                .on('error', (err) => {
                                    console.error('❌ FFmpeg conversion error:', err);
                                    // Fallback: send original WebM if conversion fails
                                    socket.broadcast.emit('audio-message', payload);
                                    fs.unlink(inputPath, () => { }); // Cleanup
                                })
                                .on('end', () => {
                                    // Read converted file
                                    fs.readFile(outputPath, (readErr, data) => {
                                        if (readErr) {
                                            console.error('❌ Failed to read converted audio:', readErr);
                                            socket.broadcast.emit('audio-message', payload); // Fallback
                                        } else {
                                            console.log(`✅ Converted audio to MP4. Size: ${data.length} bytes`);
                                            // Send MP4 buffer
                                            socket.broadcast.emit('audio-message', {
                                                ...payload,
                                                audio: data,
                                                mimeType: 'audio/mp4'
                                            });
                                        }

                                        // Cleanup temp files
                                        fs.unlink(inputPath, () => { });
                                        fs.unlink(outputPath, () => { });
                                    });
                                })
                                .save(outputPath);
                        });
                    });
                });
            });
        }).catch(err => {
            console.error('Failed to load dependencies for conversion:', err);
            socket.broadcast.emit('audio-message', payload);
        });
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
