import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../lib/config';

export function useSocket(onTrackingUpdate, onLocationUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('kalon_token');
    const url = getSocketUrl();
    if (!token || !url) return;

    const socket = io(url, { auth: { token } });
    socketRef.current = socket;

    if (onTrackingUpdate) {
      socket.on('tracking:update', onTrackingUpdate);
    }
    if (onLocationUpdate) {
      socket.on('tracking:location', onLocationUpdate);
    }

    return () => {
      socket.disconnect();
    };
  }, [onTrackingUpdate, onLocationUpdate]);

  const joinRequest = (requestId) => {
    socketRef.current?.emit('join:request', requestId);
  };

  const leaveRequest = (requestId) => {
    socketRef.current?.emit('leave:request', requestId);
  };

  return { joinRequest, leaveRequest, socket: socketRef };
}
