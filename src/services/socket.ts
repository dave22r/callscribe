import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to CallScribe API');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from CallScribe API');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        // Set up event forwarding
        this.setupEventForwarding();

        return this.socket;
    }

    private setupEventForwarding() {
        if (!this.socket) return;

        const events = [
            'incoming-call',
            'call-analyzed',
            'recording-complete',
            'call-status',
            'call-updated',
            'call-partial'
        ];

        events.forEach(event => {
            this.socket!.on(event, (data) => {
                const listeners = this.listeners.get(event);
                if (listeners) {
                    listeners.forEach(callback => callback(data));
                }
            });
        });
    }

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: Function) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    emit(event: string, data: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
