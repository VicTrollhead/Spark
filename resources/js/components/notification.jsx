import { Link, router, usePage } from '@inertiajs/react';
import { AtSign, Bookmark, Check, Heart, MessageCircle, MessagesSquareIcon, Quote, Repeat, Reply, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar.jsx';
import { useUnreadCounts } from '../contexts/unread-counts-context';
import { useInitials } from '../hooks/use-initials.jsx';
import { getProfileImageUrl } from '../lib/utils';

export function Notification({ notification, onReadChange }) {
    const { translations } = usePage().props;
    const post = notification.post;
    const sourceUser = notification.source_user;
    const getInitials = useInitials();
    const { setUnreadNotifications } = useUnreadCounts();

    const markRead = async (notificationId) => {
        try {
            const res = await fetch(`/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    Accept: 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                // Set authoritative count from server response
                setUnreadNotifications(data.unread_count);
                // Notify parent page to update its local state
                if (onReadChange) {
                    onReadChange(notificationId, true, data.unread_count, data.read_count);
                }
            }
        } catch (_) {}
    };

    const markAsReadAndNavigate = async (url, usePost = false) => {
        if (!notification.is_read) {
            await markRead(notification.id);
        }
        if (usePost) {
            router.post(url);
        } else if (url) {
            router.visit(url);
        }
    };

    const handleFollowRequest = (action) => {
        router.post(`/user/${sourceUser.id}/${notification.id}/${action}`, {}, { preserveScroll: true });
    };

    const [swipeX, setSwipeX] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const isSwiping = useRef(false);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isSwiping.current = false;
    };

    const handleTouchMove = (e) => {
        const deltaX = e.touches[0].clientX - touchStartX.current;
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
        if (deltaY > Math.abs(deltaX) && !isSwiping.current) return;
        isSwiping.current = true;
        setSwipeX(deltaX);
    };

    const handleTouchEnd = () => {
        if (swipeX < -80) {
            setDismissed(true);
            if (!notification.is_read) {
                markRead(notification.id);
            }
        }
        setSwipeX(0);
        isSwiping.current = false;
    };

    if (dismissed) return null;

    const getNotificationUrl = () => {
        if (notification.type === 'message' && sourceUser?.id) return null;
        if (notification.type === 'follow' || notification.type === 'follow_request') return `/user/${sourceUser?.username}`;
        if (post?.slug) return `/post/${post.slug}`;
        return null;
    };

    const handleRowClick = (e) => {
        if (e.target.closest('button, a, [role="button"]')) return;
        if (notification.type === 'message' && sourceUser?.id) {
            markAsReadAndNavigate(`/chat/user-chat/new/${sourceUser.id}`, true);
            return;
        }
        const url = getNotificationUrl();
        if (url) markAsReadAndNavigate(url);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'like':
                return { icon: Heart, bg: 'bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400', fill: true };
            case 'repost':
                return { icon: Repeat, bg: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' };
            case 'comment':
                return { icon: MessageCircle, bg: 'bg-blue-100 text-blue-500 dark:bg-blue-950 dark:text-blue-400' };
            case 'comment_reply':
                return { icon: Reply, bg: 'bg-blue-100 text-blue-500 dark:bg-blue-950 dark:text-blue-400' };
            case 'follow':
                return { icon: Users, bg: 'bg-purple-100 text-purple-500 dark:bg-purple-950 dark:text-purple-400' };
            case 'follow_request':
                return { icon: Users, bg: 'bg-purple-100 text-purple-500 dark:bg-purple-950 dark:text-purple-400' };
            case 'favorite':
                return { icon: Bookmark, bg: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400' };
            case 'reply':
                return { icon: Reply, bg: 'bg-cyan-100 text-cyan-500 dark:bg-cyan-950 dark:text-cyan-400' };
            case 'quote':
                return { icon: Quote, bg: 'bg-purple-100 text-purple-500 dark:bg-purple-950 dark:text-purple-400' };
            case 'mention':
                return { icon: AtSign, bg: 'bg-orange-100 text-orange-500 dark:bg-orange-950 dark:text-orange-400' };
            case 'message':
                return { icon: MessagesSquareIcon, bg: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' };
            default:
                return { icon: MessageCircle, bg: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' };
        }
    };

    const getActionText = (type) => {
        switch (type) {
            case 'like':
                return notification.extra_data
                    ? translations['liked your comment.'] || 'liked your comment.'
                    : translations['liked your post.'] || 'liked your post.';
            case 'repost':
                return translations['reposted your post.'] || 'reposted your post.';
            case 'comment':
                return translations['commented on your post:'] || 'commented on your post:';
            case 'comment_reply':
                return translations['replied to your comment:'] || 'replied to your comment:';
            case 'follow': {
                if (notification.extra_data === 'pending') return translations['has sent you a follow request.'] || 'sent you a follow request.';
                if (notification.extra_data === 'accepted') return translations['accepted your follow request.'] || 'accepted your follow request.';
                if (notification.extra_data === 'rejected') return translations['rejected your follow request.'] || 'rejected your follow request.';
                return translations['followed you.'] || 'followed you.';
            }
            case 'reply':
                return translations['replied to your post:'] || 'replied to your post:';
            case 'quote':
                return translations['quoted your post:'] || 'quoted your post:';
            case 'favorite':
                return translations['favorited your post.'] || 'favorited your post.';
            case 'mention':
                return translations['mentioned you.'] || 'mentioned you.';
            case 'message':
                return translations['sent you a message:'] || 'sent you a message:';
            default:
                return translations['interacted with you.'] || 'interacted with you.';
        }
    };

    const typeInfo = getTypeIcon(notification.type);
    const TypeIcon = typeInfo.icon;

    const renderUserLink = (username, name) => (
        <Link href={`/user/${username}`} className="font-semibold text-gray-900 hover:underline dark:text-white">
            {name}
        </Link>
    );

    const hasExtraContent =
        notification.extra_data && ['comment', 'comment_reply', 'like', 'mention', 'message', 'reply', 'quote'].includes(notification.type);
    const showExtraData = hasExtraContent && !(notification.type === 'like' && !notification.extra_data);

    return (
        <div className="relative overflow-hidden">
            {swipeX < 0 && (
                <div
                    className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end bg-gray-200 px-4 text-gray-500 dark:bg-neutral-700 dark:text-gray-300"
                    style={{ width: Math.min(Math.abs(swipeX), 120) }}
                >
                    <Check className="h-5 w-5" />
                </div>
            )}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s ease' : 'none' }}
                onClick={handleRowClick}
                className={`relative flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors sm:px-6 sm:py-5 ${
                    notification.is_read
                        ? 'bg-white hover:bg-gray-50 dark:bg-neutral-950 dark:hover:bg-neutral-900'
                        : 'bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30'
                }`}
            >
                {/* Unread dot */}
                {!notification.is_read && (
                    <div className="absolute top-1/2 left-1.5 -translate-y-1/2 sm:left-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                )}

                {/* Avatar with type icon badge */}
                <div className="relative ml-2 shrink-0 sm:ml-0">
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                        <AvatarImage src={getProfileImageUrl(sourceUser)} alt={sourceUser.name} />
                        <AvatarFallback className="rounded-full bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                            {getInitials(sourceUser.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div
                        className={`absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-neutral-950 ${typeInfo.bg}`}
                    >
                        <TypeIcon className="h-3.5 w-3.5" fill={typeInfo.fill ? 'currentColor' : 'none'} />
                    </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug sm:text-base">
                        {renderUserLink(sourceUser.username, sourceUser.name)}
                        {sourceUser.is_verified && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-blue-500 p-0.5 align-middle text-white">
                                <Check className="h-2.5 w-2.5" />
                            </span>
                        )}
                        <span className="text-gray-600 dark:text-gray-400"> {getActionText(notification.type)}</span>
                    </p>

                    {showExtraData && (
                        <p className="mt-1 line-clamp-2 text-[14px] break-words text-gray-500 dark:text-gray-400">"{notification.extra_data}"</p>
                    )}

                    {/* Follow request buttons */}
                    {notification.type === 'follow' && notification.extra_data === 'pending' && (
                        <div className="mt-2 flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleFollowRequest('accept-request')}
                                className="rounded-full bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600"
                            >
                                {translations['Accept'] || 'Accept'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFollowRequest('reject-request')}
                                className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800"
                            >
                                {translations['Decline'] || 'Decline'}
                            </button>
                        </div>
                    )}

                    <span className="mt-1.5 block text-[13px] text-gray-400 dark:text-gray-500">{notification.created_at}</span>
                </div>

                {/* Post thumbnail (if post has media) */}
                {post?.media?.length > 0 && post.media[0].file_type?.startsWith('image') && (
                    <div className="hidden shrink-0 sm:block">
                        <img src={post.media[0].url || `/storage/${post.media[0].file_path}`} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    </div>
                )}
            </div>
        </div>
    );
}
