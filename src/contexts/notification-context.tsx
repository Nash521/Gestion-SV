"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '@/lib/definitions';
import { mockNotifications } from '@/lib/data';

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    addNotification: () => {},
    markAsRead: () => {},
    markAllAsRead: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const addNotification = (notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: AppNotification = {
            id: `notif-${Date.now()}`,
            ...notificationData,
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };
    
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({...n, read: true})));
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
