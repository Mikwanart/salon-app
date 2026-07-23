import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    timestamp: number;
    read: boolean;
    targetUserEmail?: string;
    appointmentId?: string;
    status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    salonName?: string;
    actions?: ('accept' | 'decline')[];
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (message: string, type?: Notification['type'], extra?: Partial<Notification>) => void;
    addNotificationForUser: (userEmail: string, notif: Partial<Notification>) => void;
    markAllRead: () => void;
    clearAll: () => void;
    updateNotificationActionStatus: (appointmentId: string, status: 'CONFIRMED' | 'CANCELLED') => void;
    syncWithAppointments: (rawAppointments: any[], isOwner?: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getStorageKey = (email?: string) => `salon_notifs_${email?.toLowerCase() || 'guest'}`;

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const currentEmail = user?.email;
    const cleanCurrentEmail = currentEmail?.toLowerCase();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const loadedEmailRef = useRef<string | undefined>(undefined);

    // Reload notifications whenever logged-in user changes
    useEffect(() => {
        if (!cleanCurrentEmail) {
            setNotifications([]);
            loadedEmailRef.current = undefined;
            return;
        }

        const key = getStorageKey(cleanCurrentEmail);
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed: Notification[] = JSON.parse(stored);
                // Ensure strictly scoped to this user
                const filtered = parsed.filter(n => !n.targetUserEmail || n.targetUserEmail.toLowerCase() === cleanCurrentEmail);
                setNotifications(filtered);
            } else {
                setNotifications([]);
            }
        } catch {
            setNotifications([]);
        }
        loadedEmailRef.current = cleanCurrentEmail;
    }, [cleanCurrentEmail]);

    // Persist notifications ONLY for the active loaded user to avoid race conditions when switching accounts
    useEffect(() => {
        if (!cleanCurrentEmail || loadedEmailRef.current !== cleanCurrentEmail) return;
        const key = getStorageKey(cleanCurrentEmail);
        localStorage.setItem(key, JSON.stringify(notifications));
    }, [notifications, cleanCurrentEmail]);

    // Listen for storage events / custom events across tabs & sessions
    useEffect(() => {
        const handleUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (!cleanCurrentEmail) return;
            const targetEmail = customEvent.detail?.targetEmail;
            if (!targetEmail || targetEmail.toLowerCase() === cleanCurrentEmail) {
                const key = getStorageKey(cleanCurrentEmail);
                try {
                    const stored = localStorage.getItem(key);
                    if (stored) setNotifications(JSON.parse(stored));
                } catch {}
            }
        };

        const handleStorage = (e: StorageEvent) => {
            if (!cleanCurrentEmail) return;
            const key = getStorageKey(cleanCurrentEmail);
            if (e.key === key && e.newValue) {
                try {
                    setNotifications(JSON.parse(e.newValue));
                } catch {}
            }
        };

        window.addEventListener('salon_notification_update', handleUpdate);
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('salon_notification_update', handleUpdate);
            window.removeEventListener('storage', handleStorage);
        };
    }, [cleanCurrentEmail]);

    const addNotification = useCallback((message: string, type: Notification['type'] = 'info', extra: Partial<Notification> = {}) => {
        if (!cleanCurrentEmail) return;
        const notif: Notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
            message,
            type,
            timestamp: Date.now(),
            read: false,
            targetUserEmail: cleanCurrentEmail,
            ...extra
        };
        setNotifications(prev => [notif, ...prev].slice(0, 30));
    }, [cleanCurrentEmail]);

    const addNotificationForUser = useCallback((targetEmail: string, notifData: Partial<Notification>) => {
        if (!targetEmail) return;
        const cleanTargetEmail = targetEmail.toLowerCase();
        const targetKey = getStorageKey(cleanTargetEmail);

        const newNotif: Notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
            message: notifData.message || 'New Notification',
            type: notifData.type || 'info',
            timestamp: Date.now(),
            read: false,
            targetUserEmail: cleanTargetEmail,
            ...notifData
        };

        try {
            const existing: Notification[] = JSON.parse(localStorage.getItem(targetKey) || '[]');
            const isDup = existing.some(n => n.appointmentId === newNotif.appointmentId && n.status === newNotif.status && n.message === newNotif.message);
            if (!isDup) {
                const updated = [newNotif, ...existing].slice(0, 30);
                localStorage.setItem(targetKey, JSON.stringify(updated));
            }
        } catch (e) {
            console.error('Failed to store notification for user:', cleanTargetEmail, e);
        }

        // If target user is currently active in this session
        if (cleanCurrentEmail && cleanCurrentEmail === cleanTargetEmail) {
            setNotifications(prev => {
                const isDup = prev.some(n => n.appointmentId === newNotif.appointmentId && n.status === newNotif.status && n.message === newNotif.message);
                if (isDup) return prev;
                return [newNotif, ...prev].slice(0, 30);
            });
        }

        // Notify other windows/tabs
        window.dispatchEvent(new CustomEvent('salon_notification_update', { detail: { targetEmail: cleanTargetEmail } }));
    }, [cleanCurrentEmail]);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const updateNotificationActionStatus = useCallback((appointmentId: string, status: 'CONFIRMED' | 'CANCELLED') => {
        setNotifications(prev => prev.map(n => {
            if (n.appointmentId === appointmentId) {
                return {
                    ...n,
                    status,
                    read: true,
                    actions: undefined,
                    message: `${n.message} (Marked as ${status})`
                };
            }
            return n;
        }));
    }, []);

    const syncWithAppointments = useCallback((rawAppointments: any[], isOwner: boolean = false) => {
        if (!cleanCurrentEmail || !rawAppointments || !Array.isArray(rawAppointments)) return;
        const key = getStorageKey(cleanCurrentEmail);

        try {
            const existing: Notification[] = JSON.parse(localStorage.getItem(key) || '[]');
            const newNotifs: Notification[] = [];

            rawAppointments.forEach((a: any) => {
                const apptId = a.id;
                const status = a.status; // CONFIRMED, CANCELLED, PENDING, COMPLETED
                const salonName = a.salon?.name || a.salonName || 'Salon';
                const serviceName = a.service?.name || a.serviceName || 'Service';
                const clientName = a.client?.name || a.customerName || 'Client';
                const dateVal = a.date ? new Date(a.date) : null;
                const formattedDate = dateVal && !isNaN(dateVal.getTime()) ? dateVal.toLocaleDateString() : '';

                if (isOwner) {
                    // Salon Owner Notifications
                    if (status === 'PENDING') {
                        const message = `🔔 New booking request from ${clientName} for ${serviceName}${formattedDate ? ` on ${formattedDate}` : ''}.`;
                        const exists = existing.some(n => n.appointmentId === apptId && n.status === 'PENDING');
                        if (!exists) {
                            newNotifs.push({
                                id: `sync_owner_${apptId}_pending`,
                                message,
                                type: 'warning',
                                timestamp: a.createdAt ? new Date(a.createdAt).getTime() : Date.now(),
                                read: false,
                                targetUserEmail: cleanCurrentEmail,
                                appointmentId: apptId,
                                status: 'PENDING',
                                salonName,
                                actions: ['accept', 'decline']
                            });
                        }
                    }
                } else {
                    // Client Notifications
                    if (status === 'CONFIRMED') {
                        const message = `🎉 ${salonName} ACCEPTED your booking for ${serviceName}${formattedDate ? ` on ${formattedDate}` : ''}!`;
                        const exists = existing.some(n => n.appointmentId === apptId && n.status === 'CONFIRMED');
                        if (!exists) {
                            newNotifs.push({
                                id: `sync_client_${apptId}_confirmed`,
                                message,
                                type: 'success',
                                timestamp: Date.now(),
                                read: false,
                                targetUserEmail: cleanCurrentEmail,
                                appointmentId: apptId,
                                status: 'CONFIRMED',
                                salonName
                            });
                        }
                    } else if (status === 'CANCELLED') {
                        const message = `❌ ${salonName} DECLINED your booking request for ${serviceName}.`;
                        const exists = existing.some(n => n.appointmentId === apptId && n.status === 'CANCELLED');
                        if (!exists) {
                            newNotifs.push({
                                id: `sync_client_${apptId}_cancelled`,
                                message,
                                type: 'error',
                                timestamp: Date.now(),
                                read: false,
                                targetUserEmail: cleanCurrentEmail,
                                appointmentId: apptId,
                                status: 'CANCELLED',
                                salonName
                            });
                        }
                    } else if (status === 'PENDING') {
                        const message = `⏳ Your booking request for ${serviceName} at ${salonName}${formattedDate ? ` on ${formattedDate}` : ''} was submitted and is pending approval.`;
                        const exists = existing.some(n => n.appointmentId === apptId && n.status === 'PENDING');
                        if (!exists) {
                            newNotifs.push({
                                id: `sync_client_${apptId}_pending`,
                                message,
                                type: 'info',
                                timestamp: Date.now(),
                                read: false,
                                targetUserEmail: cleanCurrentEmail,
                                appointmentId: apptId,
                                status: 'PENDING',
                                salonName
                            });
                        }
                    }
                }
            });

            if (newNotifs.length > 0) {
                const combined = [...newNotifs, ...existing].slice(0, 30);
                localStorage.setItem(key, JSON.stringify(combined));
                setNotifications(combined);
            }
        } catch (e) {
            console.error('Failed to sync notifications with appointments:', e);
        }
    }, [cleanCurrentEmail]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            addNotificationForUser,
            markAllRead,
            clearAll,
            updateNotificationActionStatus,
            syncWithAppointments
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
}
