import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';

const UnreadCountsContext = createContext({
    unreadNotifications: 0,
    unreadMessages: 0,
    setUnreadNotifications: () => {},
    refreshCounts: () => {},
    refreshNotificationCount: () => {},
    refreshMessageCount: () => {},
});

export function UnreadCountsProvider({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const fetchNotificationCount = useCallback(async () => {
        try {
            const res = await fetch('/notifications/unread-count');
            if (res.ok) {
                const data = await res.json();
                setUnreadNotifications(data.unread_count);
            }
        } catch (_) {}
    }, []);

    const fetchMessageCount = useCallback(async () => {
        try {
            const res = await fetch('/chat/user-chat/messages/unread-count');
            if (res.ok) {
                const data = await res.json();
                setUnreadMessages(data.unread_count);
            }
        } catch (_) {}
    }, []);

    const refreshCounts = useCallback(() => {
        fetchNotificationCount();
        fetchMessageCount();
    }, [fetchNotificationCount, fetchMessageCount]);

    useEffect(() => {
        if (!user?.id) return;

        // Initial fetch
        refreshCounts();

        // WebSocket listeners
        const notifChannel = window.Echo.private(`notifications.${user.id}`);
        notifChannel
            .listen('NotificationCreated', () => {
                // New notification — always fetch authoritative count from server
                fetchNotificationCount();
            })
            .listen('NotificationIsReadChange', (e) => {
                // Server already changed DB — fetch the real count
                if (e.operation === 'allRead') {
                    setUnreadNotifications(0);
                } else if (e.operation === 'allUnread') {
                    fetchNotificationCount();
                } else {
                    // For single read/unread, just re-fetch — it's fast and authoritative
                    fetchNotificationCount();
                }
            });

        const chatChannel = window.Echo.private(`user-chats.${user.id}`);
        chatChannel
            .listen('UserMessageCreated', () => {
                fetchMessageCount();
            })
            .listen('UserMessageIsReadChange', () => {
                fetchMessageCount();
            });

        // Re-fetch counts when tab becomes visible again (handles missed events while tab was hidden)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshCounts();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also re-fetch periodically as a safety net (every 60s)
        const interval = setInterval(refreshCounts, 60000);

        return () => {
            window.Echo.leave(`notifications.${user.id}`);
            window.Echo.leave(`user-chats.${user.id}`);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [user?.id]);

    return (
        <UnreadCountsContext.Provider
            value={{
                unreadNotifications,
                unreadMessages,
                setUnreadNotifications,
                refreshCounts,
                refreshNotificationCount: fetchNotificationCount,
                refreshMessageCount: fetchMessageCount,
            }}
        >
            {children}
        </UnreadCountsContext.Provider>
    );
}

export function useUnreadCounts() {
    return useContext(UnreadCountsContext);
}
