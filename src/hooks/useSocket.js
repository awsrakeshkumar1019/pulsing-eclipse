'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function useSocket() {
    const socketRef = useRef(null);

    const getSocket = useCallback(() => {
        if (!socketInstance) {
            socketInstance = io({
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected:', socketInstance.id);
            });

            socketInstance.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });

            socketInstance.on('connect_error', (error) => {
                console.error('Socket connection error:', error.message);
            });
        }

        socketRef.current = socketInstance;
        return socketInstance;
    }, []);

    useEffect(() => {
        return () => {
            // Don't disconnect on unmount - socket is shared
        };
    }, []);

    const disconnect = useCallback(() => {
        if (socketInstance) {
            socketInstance.disconnect();
            socketInstance = null;
            socketRef.current = null;
        }
    }, []);

    return { getSocket, disconnect, socket: socketRef };
}
