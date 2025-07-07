import React, {createContext, useContext, useEffect, useState} from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({children}) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to same-origin server
    console.log('🔗 Connecting to server...');
    const newSocket = io({
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      path: '/socket.io',
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('✅ Connected to server');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚨 Connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    connected,
    emit: (event, data) => socket?.emit(event, data),
    on: (event, callback) => socket?.on(event, callback),
    off: (event, callback) => socket?.off(event, callback)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}