// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { notificationAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const queryClient = useQueryClient();
    const [unreadCount, setUnreadCount] = useState(0);
    const lastUnreadCount = useRef(0);
    const audioRef = useRef(null);

    // Notification Sound URL (Mixkit Alert)
    const soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

    const { data: countData } = useQuery(
        ['unreadCount', user?._id],
        () => notificationAPI.unreadCount(),
        {
            enabled: !!isAuthenticated,
            refetchInterval: 10000, // Poll every 10 seconds
            onSuccess: (data) => {
                const newCount = data.count || 0;
                if (newCount > lastUnreadCount.current) {
                    playNotificationSound();
                }
                lastUnreadCount.current = newCount;
                setUnreadCount(newCount);
            }
        }
    );

    const playNotificationSound = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(soundUrl);
        }
        audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    };

    const refreshNotifications = () => {
        queryClient.invalidateQueries(['unreadCount', user?._id]);
        queryClient.invalidateQueries('notifications');
    };

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
