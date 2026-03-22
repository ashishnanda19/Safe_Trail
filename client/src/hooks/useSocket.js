import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { useSosStore } from '@/store/sosStore';

export const useSocket = () => {
  const { accessToken } = useAuthStore();
  const { setSocket, setConnected, clearSocket } = useSocketStore();
  const navigate = useNavigate();
  const toastIdRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = connectSocket(accessToken);
    setSocket(socket);

    socket.on('connect', () => {
      setConnected(true);
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toast.success('Reconnected', { duration: 2000 });
        toastIdRef.current = null;
      }
      // Re-join active SOS room after reconnect
      const { activeSosId } = useSosStore.getState();
      if (activeSosId) {
        socket.emit('map:join-sos', { sosEventId: activeSosId });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      toastIdRef.current = toast.loading('Reconnecting...', { duration: Infinity });
    });

    // Guardian receives SOS alert from someone in their circle
    socket.on('sos:triggered', ({ sosEventId, userId, userName }) => {
      toast.error(`🚨 ${userName || 'Someone'} triggered SOS!`, { duration: 8000 });
      navigate(`/guardian/alert/${sosEventId}`);
    });

    // When someone accepts your invite, the backend tells your socket to join their SOS room live
    socket.on('guardian:added', ({ userId }) => {
      socket.emit('sos:join', { targetUserId: userId });
      console.log(`Live joined SOS room for protected user: ${userId}`);
    });

    return () => {
      disconnectSocket();
      clearSocket();
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return getSocket();
};
