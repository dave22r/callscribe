import { useState, useEffect } from 'react';
import { socketService } from '@/services/socket';

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = socketService.connect();

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socketService.on('connect', handleConnect);
        socketService.on('disconnect', handleDisconnect);

        // Check initial connection state
        setIsConnected(socket.connected);

        return () => {
            socketService.off('connect', handleConnect);
            socketService.off('disconnect', handleDisconnect);
        };
    }, []);

    return { isConnected, socket: socketService };
};

export const useSocketEvent = (event: string, callback: (data: any) => void) => {
    useEffect(() => {
        socketService.on(event, callback);

        return () => {
            socketService.off(event, callback);
        };
    }, [event, callback]);
};
