import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios.js';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
    }
  }, [token]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
    });

    socket.on('notification', (n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await api.put('/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
    }
  }, [token]);

  const removeNotification = useCallback(async (id) => {
    if (!token) return;
    try {
      await api.delete(`/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
    }
  }, [token]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
