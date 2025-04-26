import { Head, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useInitials } from '../../hooks/use-initials';
import { useState } from 'react';

export default function Notifications() {
    const { auth, notifications, translations } = usePage().props;
    const [isLoading, setIsLoading] = useState(false);
    const getInitials = useInitials();
    const [sort, setSort] = useState(usePage().props.sort || 'latest');

    const handleSortChange = (value) => {
        router.get(route('notifications.index'), { sort: value }, { preserveScroll: true });
    };

    const toggleReadStatus = (notification) => {
        const routeName = notification.is_read ? 'notifications.unread' : 'notifications.read';
        router.patch(route(routeName, notification.id), {}, {
            preserveScroll: true,
        });
    };

    const renderUserLink = (username, name) => (
        <Link
            href={`/user/${username}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500"
        >
            {name ? (
                <>
                    {name} (@{username})
                </>
            ) : (
                <>
                    (@{username})
                </>
            )}


        </Link>
    );
    const renderPostLink = (postId) => (
        <Link
            href={`/post/${postId}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500"
        >
            View Post
        </Link>
    );
    const renderMessage = (notification) => {
        const { type, source_user, post } = notification;
        const name = source_user?.name || 'Someone';
        const username = source_user?.username || 'username';

        switch (type) {
            case 'like':
                return (
                    <>
                        {renderUserLink(username, name)} liked your post. <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                    </>
                );
            case 'repost':
                return (
                    <>
                        {renderUserLink(username, name)} reposted your post. <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                    </>
                );
            case 'comment':
                return (
                    <>
                        {renderUserLink(username, name)} commented on your post: <span className="text-[16px]">"{notification.extra_data}"</span> <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                    </>
                );
            case 'follow':
                return (
                    <>
                        {renderUserLink(username, name)} followed you. <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                    </>
                );
            case 'favorite':
                return (
                    <>
                        {renderUserLink(username, name)} favorited your post. <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                    </>
                );
            default:
                return (
                    <>
                        {renderUserLink(username, name)} interacted with you. <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                    </>
                );
        }
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
                    notifications.map((notification) => {
                        const post = notification.post;
                        const sourceUser = notification.source_user;

                        return (
                            <div
                                key={notification.id + notification.created_at}
                                className="flex items-start gap-4 p-5 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-all"
                            >
                                <div className="flex-shrink-0">
                                    <Avatar className="h-12 w-12">
                                        {sourceUser?.profile_image_url ? (
                                            <AvatarImage
                                                src={sourceUser.profile_image_url}
                                                alt={sourceUser.name}
                                            />
                                        ) : (
                                            <AvatarFallback className="rounded-full bg-gray-300 text-black dark:bg-gray-700 dark:text-white">
                                                {getInitials(sourceUser.name)}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                </div>

                                <div className={`flex flex-col w-full gap-1 ${!post ? 'justify-center' : ''}`}>
                                    <div className={`text-gray-800 dark:text-gray-100 text-lg p-2 mb-1 font-medium`}>
                                        {renderMessage(notification)}
                                    </div>

                                    {post && post.user && (
                                        <PostComponent post={post} compact />
                                    )}
                                </div>

                                {post && post.user && (
                                    <Link
                                        href={`/post/${post.id}`}
                                        className="hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg p-2 transition-all"
                                    >
                                        <ArrowRight className="text-gray-500 dark:text-gray-400" size={24} />
                                    </Link>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">
                        {translations['No notifications yet.']}
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
