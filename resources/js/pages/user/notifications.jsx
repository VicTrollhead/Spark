import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { EmptyState } from '../../components/empty-state.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Notification } from '../../components/notification.jsx';
import { motion } from 'framer-motion';
import { usePullToRefresh } from '../../hooks/use-pull-to-refresh';
import { useUnreadCounts } from '../../contexts/unread-counts-context';

export default function Notifications() {
    const { auth, notifications: initialNotifications = [], translations = {}, read_count: initialReadCount = 0, unread_count: initialUnreadCount = 0 } = usePage().props;
    const user = auth?.user;
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState(usePage().props.sort || 'unread');
    const [notifications, setNotifications] = useState(initialNotifications);
    const [readCount, setReadCount] = useState(initialReadCount);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const { unreadNotifications: contextUnread, setUnreadNotifications } = useUnreadCounts();
    const prevContextUnread = useRef(contextUnread);
    const filterRef = useRef(filter);
    filterRef.current = filter;

    // Lightweight JSON fetch — no Inertia reload, no white flash
    const fetchNotifications = useCallback(async (sort) => {
        try {
            const res = await fetch(`/user/notifications?sort=${sort || filterRef.current}`, {
                headers: { 'Accept': 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setReadCount(data.read_count);
                setUnreadCount(data.unread_count);
            }
        } catch (_) {}
    }, []);

    // Fetch fresh data on mount to handle back-button / Inertia cache staleness
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // React to context unread count changes (driven by WebSocket in the context)
    // This replaces the duplicate WebSocket listener that was destroying the context's listener
    useEffect(() => {
        if (contextUnread !== prevContextUnread.current) {
            prevContextUnread.current = contextUnread;
            fetchNotifications();
        }
    }, [contextUnread, fetchNotifications]);

    // Called by each Notification component after it marks itself as read via fetch
    const handleReadChange = (notificationId, isRead, serverUnreadCount, serverReadCount) => {
        // Update local page counts with authoritative server values
        setUnreadCount(serverUnreadCount);
        setReadCount(serverReadCount);

        // Update the notification item in the local list
        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, is_read: isRead } : n)),
        );
    };

    const handleFilterChange = (value) => {
        setFilter(value);
        // Update URL without full page reload so filter persists on refresh
        window.history.replaceState({}, '', `/user/notifications?sort=${value}`);
        fetchNotifications(value);
    };

    const handleReload = () => {
        setIsLoading(true);
        fetchNotifications().finally(() => setIsLoading(false));
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await fetch(route('notifications.markAllAsRead'), {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unread_count);
                setReadCount(data.read_count);
                setUnreadNotifications(data.unread_count);
                // Mark all local notifications as read
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            }
        } catch (_) {}
    };

    const { pulling, pullDistance } = usePullToRefresh(handleReload);

    const filters = [
        { value: 'unread', label: translations['Unread'] || 'Unread', count: unreadCount },
        { value: 'latest', label: translations['All'] || 'All', count: readCount + unreadCount },
        { value: 'read', label: translations['Read'] || 'Read', count: readCount },
    ];

    return (
        <AppLayout>
            <Head title={translations['Notifications']} />

            {pullDistance > 0 && (
                <div className="flex justify-center overflow-hidden transition-all lg:hidden" style={{ height: pullDistance }}>
                    <RefreshCw className={`h-5 w-5 text-gray-400 mt-2 ${pulling ? 'text-blue-500 animate-spin' : ''}`} />
                </div>
            )}

            <div className="border-b border-gray-200 dark:border-neutral-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6">
                    <h1 className="text-2xl font-bold">
                        {translations['Notifications'] || 'Notifications'}
                    </h1>
                    <div className="flex items-center gap-1.5">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="cursor-pointer flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                            >
                                <CheckCheck className="h-4 w-4" />
                                <span className="hidden sm:inline">{translations['Mark all read'] || 'Mark all read'}</span>
                            </button>
                        )}
                        <button
                            onClick={handleReload}
                            aria-label={translations['Refresh notifications'] || 'Refresh'}
                            className="cursor-pointer rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2 px-6 py-3">
                    {filters.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => handleFilterChange(f.value)}
                            className={`cursor-pointer relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                filter === f.value
                                    ? 'bg-brand text-brand-foreground shadow-sm'
                                    : 'bg-accent text-accent-foreground hover:bg-accent/70'
                            }`}
                        >
                            {f.label}
                            {f.count > 0 && (
                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${
                                    filter === f.value
                                        ? 'bg-white/20 text-current'
                                        : 'bg-background text-muted-foreground'
                                }`}>
                                    {f.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                        <motion.div
                            key={notification.id + notification.created_at}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                        >
                            <Notification notification={notification} onReadChange={handleReadChange} />
                        </motion.div>
                    ))
                ) : (
                    <div className="py-16">
                        <EmptyState
                            icon={Bell}
                            title={filter === 'unread'
                                ? (translations["You're all caught up!"] || "You're all caught up!")
                                : (translations['No notifications yet.'] || 'No notifications yet.')}
                            description={filter === 'unread'
                                ? (translations['No unread notifications.'] || 'No unread notifications.')
                                : (translations["When you get notifications, they'll show up here."] || "When you get notifications, they'll show up here.")}
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
