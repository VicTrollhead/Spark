import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowRight } from 'lucide-react';
import { useInitials } from '../../hooks/use-initials';

export default function Notifications() {
    const { auth, notifications, translations } = usePage().props;
    const getInitials = useInitials();
    console.log(notifications);
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

    return (
        <AppLayout>
            <Head title={translations['Notifications']} />

            <div className="flex justify-between items-center p-6">
                <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white">
                    {translations['Notifications']}
                </h1>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {notifications.length > 0 ? (
                    notifications.map((notification) => {
                        const post = notification.post;
                        const sourceUser = notification.source_user;

                        return (
                            <div
                                key={notification.id + notification.created_at}
                                className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-all rounded-lg"
                            >
                                <div className="flex items-center gap-3">
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
                                                ?
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>

                                <div className="flex flex-col w-full">
                                    <div className="text-lg text-gray-800 p-2 dark:text-gray-100 font-medium">
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
