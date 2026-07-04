import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket,    setSocket]    = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth:            { token },
      transports:      ['websocket'],
      reconnection:    true,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      console.log('Socket connected:', s.id);
      setConnected(true);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
      setConnected(false);
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  const joinSchool  = (schoolId) => socket?.emit('join_school',  schoolId);
  const leaveSchool = (schoolId) => socket?.emit('leave_school', schoolId);
  const sendTyping  = (schoolId, isTyping) => socket?.emit('typing', { schoolId, isTyping });

  return (
    <SocketContext.Provider value={{ socket, connected, joinSchool, leaveSchool, sendTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
};

export default SocketContext;
