import { Link, usePage } from '@inertiajs/react';
import { Bell, Home, MessageCircle, Search, User } from 'lucide-react';
import { useUnreadCounts } from '../contexts/unread-counts-context';

export function MobileNav() {
    const { auth, translations } = usePage().props;
    const user = auth?.user;
    const { unreadNotifications, unreadMessages } = useUnreadCounts();

    if (!user) return null;

    const currentPath = window.location.pathname;

    const items = [
        { href: '/dashboard', icon: Home, label: translations['Home'] || 'Home' },
        { href: '/search', icon: Search, label: translations['Search'] || 'Search' },
        { href: '/user/notifications', icon: Bell, label: translations['Alerts'] || 'Alerts', count: unreadNotifications },
        { href: '/chat/user-chats', icon: MessageCircle, label: translations['Chats'] || 'Chats', count: unreadMessages },
        { href: `/user/${user.username}`, icon: User, label: translations['Profile'] || 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-center justify-around py-2">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition ${
                                isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <div className="relative">
                                <Icon className="h-5 w-5" />
                                {item.count > 0 && (
                                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                        {item.count > 99 ? '99+' : item.count}
                                    </span>
                                )}
                            </div>
                            <span className="mt-0.5">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
