"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppNotification } from '@/lib/definitions';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToNotifications, addNotification as addNotificationToDB, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firebase/services';

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
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (currentUser) {
            const unsubscribe = subscribeToNotifications(setNotifications);
            return () => unsubscribe();
        }
    }, [currentUser]);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const addNotification = async (notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        try {
            await addNotificationToDB(notificationData);
        } catch (error) {
            console.error("Failed to add notification:", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await markNotificationAsRead(id);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };
    
    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;
        try {
            await markAllNotificationsAsRead(unreadIds);
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);