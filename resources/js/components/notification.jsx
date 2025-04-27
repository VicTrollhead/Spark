import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar.jsx";
import { Link, router, usePage } from "@inertiajs/react";
import { ArrowRight, Heart, Repeat, Bookmark, Users, MessageSquare, Eye, EyeClosed, EyeOff } from "lucide-react";
import { useInitials } from "../hooks/use-initials.jsx";

export function Notification({ notification }) {
    const { translations } = usePage().props;
    const post = notification.post;
    const sourceUser = notification.source_user;
    const getInitials = useInitials();

    const toggleReadStatus = () => {
        const routeName = notification.is_read ? 'unread' : 'read';
        router.patch(`/notifications/${notification.id}/${routeName}`, {}, {
            preserveScroll: true,
        });
    };

    const renderUserLink = (username, name) => (
        <Link
            href={`/user/${username}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500"
        >
            {name} <span className="text-sm">(@{username})</span>
        </Link>
    );

    const handleFollowRequest = (user, action) => {
        router.post(`/user/${user}/${action}`, {}, {
            preserveScroll: true,
        });
    };


    const getColor = (type) => {
        switch (type) {
            case 'like':
                return 'border-l-red-600';
            case 'repost':
                return 'border-l-green-500';
            case 'comment':
                return 'border-l-gray-700';
            case 'follow':
                return 'border-l-blue-800';
            case 'favorite':
                return 'border-l-yellow-500';
            default:
                return 'border-l-gray-600';
        }
    }

    const renderMessage = (notification) => {
        const { type, source_user, post } = notification;
        const name = source_user?.name || translations['Someone'];
        const username = source_user?.username || '';

        switch (type) {
            case 'like':
                return (
                    <div className="flex flex-col gap-1">
                        <span>{renderUserLink(username, name)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                        <div className="flex flex-row"><Heart className="h-5 w-5 my-auto" /><span className="ml-2">{translations['liked your post.']}</span></div>
                    </div>
                );
            case 'repost':
                return (
                    <div className="flex flex-col gap-1">
                        <span>{renderUserLink(username, name)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                        <div className="flex flex-row"><Repeat className="h-5 w-5 my-auto"/><span className="ml-2">{translations['reposted your post.']}</span></div>
                    </div>
                );
            case 'comment':
                return (
                    <div className="flex flex-col gap-1">
                        <span>{renderUserLink(username, name)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                        <div className="flex flex-row"><MessageSquare className="h-5 w-5 my-auto"/><span className="ml-2">{translations['commented on your post:']}</span></div>
                        <div className="text-[16px]">"{notification.extra_data}"</div>
                    </div>
                );
            case 'follow':
                const isFollowRequest = notification.extra_data === 'pending'; // <-- you can adjust this depending on your backend
                return (
                    <div className="flex flex-col gap-1">
                        <span>{renderUserLink(username, name)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                        {isFollowRequest ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-row items-center">
                                    <Users className="h-5 w-5 my-auto" />
                                    <span className="ml-2">{translations['has sent you a follow request.']}</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleFollowRequest(notification.id, 'accept-request')}
                                        className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-green-700"
                                    >
                                        {translations['Accept']}
                                    </button>
                                    <button
                                        onClick={() => handleFollowRequest(notification.id, 'decline-request')}
                                        className="px-3 py-1 text-white bg-red-600 rounded-md hover:bg-red-700"
                                    >
                                        {translations['Decline']}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-row">
                                <Users className="h-5 w-5 my-auto" />
                                <span className="ml-2">{translations['followed you.']}</span>
                            </div>
                        )}
                    </div>
                );

            case 'favorite':
                return (
                    <div className="flex flex-col gap-1">
                        <span>{renderUserLink(username, name)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                        <div className="flex flex-row"><Bookmark className="h-5 w-5 my-auto"/><span className="ml-2">{translations['favorited your post.']}</span></div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col gap-1">
                        <span>{renderUserLink(username, name)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{notification.created_at}</span>
                        <div className="flex flex-row"><span className="ml-2">{translations['interacted with you.']}</span></div>
                    </div>
                );
        }
    };

    return (
        <div
            className={`border-l-4 ${getColor(notification.type)} border-t-0 border-r-0 border-b-gray-400 flex items-start gap-4 p-5 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-900 dark:hover:bg-neutral-950 transition-all`}

        >

            <div className="hidden md:flex items-center gap-4">
                <Avatar className="h-14 w-14">
                    <AvatarImage
                        src={sourceUser.profile_image_url}
                        alt={sourceUser.name}
                    />
                    <AvatarFallback
                        className="rounded-full bg-gray-300 text-black dark:bg-gray-700 dark:text-white">
                        {getInitials(sourceUser.name)}
                    </AvatarFallback>
                </Avatar>
            </div>

            <div className="flex flex-col w-full">
                <div className="text-sm md:text-lg text-gray-800 p-1 mb-1 dark:text-gray-100 font-medium">
                    {renderMessage(notification)}
                </div>
            </div>
            <div className="my-auto">
                {notification.is_read ? (
                    <EyeOff size={28} onClick={toggleReadStatus} className="cursor-pointer"/>
                ) : (
                    <Eye size={28} onClick={toggleReadStatus} className="cursor-pointer"/>
                )}
            </div>
            {post && post.user && (
                <Link
                    href={`/post/${post.id}`}
                    className="text-gray-700 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200 rounded-lg p-2 transition-all my-auto"
                >
                    <ArrowRight className="ml-auto" size={28}/>
                </Link>
            )}
        </div>
    );
}
