import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import {RefreshCw} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Notification} from "../../components/notification.jsx";

export default function Notifications() {
    const { auth, notifications, translations } = usePage().props;
    const user = auth?.user;
    const [isLoading, setIsLoading] = useState(false);
    const [sort, setSort] = useState(usePage().props.sort || 'unread');

    useEffect(() => {
        window.Echo.private(`notifications.${user.id}`)
            .listen('NotificationCreated', handleReload);
        return () => {
            window.Echo.leave(`notifications.${user.id}`);
        };
    }, []);

    const handleSortChange = (value) => {
        router.get(route('notifications.index'), { sort: value }, { preserveScroll: true });
    };
    const handleReload = () => {
        setIsLoading(true);
        router.reload();
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    return (
        <AppLayout>
            <Head title={translations['Notifications']} />

            <div className="flex justify-between items-center p-6">
                <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white">
                    {translations['Notifications']}
                </h1>
                <div className="flex justify-between items-centerak gap-2">
                    <select
                        value={sort}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="ml-4 px-3 py-1 border rounded-md dark:bg-neutral-900 dark:text-white"
                    >
                        <option value="latest">{translations['Latest']}</option>
                        <option value="oldest">{translations['Oldest']}</option>
                        <option value="read">{translations['Read']}</option>
                        <option value="unread">{translations['Unread']}</option>
                    </select>
                    <button
                        onClick={handleReload}
                        className="flex items-center rounded-md border p-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-200 dark:text-white dark:hover:bg-neutral-800"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800 -mt-2">
                {notifications.length > 0 ? (
                    notifications.map((notification) => <Notification key={notification.id + notification.created_at} notification={notification}/>)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">
                        {translations['No notifications yet.']}
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
