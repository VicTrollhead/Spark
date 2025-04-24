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
    const renderUserLink = (username, name) => (
        <Link
            href={`/user/${username}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500"
        >
            {name} (@{username})
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
                        {renderUserLink(username, name)} liked your post.
                    </>
                );
            case 'repost':
                return (
                    <>
                        {renderUserLink(username, name)} reposted your post.
                    </>
                );
            case 'comment':
                return (
                    <>
                        {renderUserLink(username, name)} commented on your post: <div className="text-sm">"{notification.extra_data}"</div>
                    </>
                );
            case 'follow':
                return (
                    <>
                        {renderUserLink(username, name)} followed you.
                    </>
                );
            case 'favorite':
                return (
                    <>
                        {renderUserLink(username, name)} favorited your post.
                    </>
                );
            default:
                return (
                    <>
                        {renderUserLink(username, name)} interacted with you.
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
                <button
                    onClick={handleReload}
                    className="flex items-center rounded-md border p-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-200 dark:text-white dark:hover:bg-neutral-800"
                >
                    <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>


            <div className="divide-y divide-gray-200 dark:divide-gray-800 -mt-2">
                {notifications.length > 0 ? (
                    notifications.map((notification) => {
                        const post = notification.post;
                        const sourceUser = notification.source_user;

                        return (
                            <div
                                key={notification.id + notification.created_at}
                                className="flex items-start gap-4 p-5 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-all "
                            >
                                <div className="flex items-center gap-4">
                                    {post?.user ? (
                                        <Avatar className="h-14 w-14">
                                            <AvatarImage
                                                src={sourceUser.profile_image_url}
                                                alt={sourceUser.name}
                                            />
                                            <AvatarFallback className="rounded-full bg-gray-300 text-black dark:bg-gray-700 dark:text-white">
                                                {getInitials(sourceUser.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <Avatar className="h-14 w-14">
                                            <AvatarFallback className="rounded-full bg-gray-300 text-black dark:bg-gray-700 dark:text-white">
                                                {getInitials(sourceUser.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>

                                <div className="flex flex-col w-full">
                                    <div className="text-lg text-gray-800 p-2 mb-1 dark:text-gray-100 font-medium">
                                        {renderMessage(notification)}
                                    </div>
                                    {post && post.user && (
                                        <PostComponent post={post} compact />
                                    )}
                                </div>
                                {post && post.user && (
                                    <Link
                                        href={`/post/${post.id}`}
                                        className=" hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg p-2 transition-all"
                                    >
                                        <ArrowRight className="text-gray-500 dark:text-gray-400 ml-auto" size={28} />
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
