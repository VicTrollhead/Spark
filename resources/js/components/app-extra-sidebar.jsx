import { Link, router, usePage } from '@inertiajs/react';
import { Check, Hash, TrendingUp, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useInitials } from '../hooks/use-initials';
import { getProfileImageUrl } from '../lib/utils';

export function AppExtraSidebar() {
    const { auth, translations } = usePage().props;
    const currentUrl = usePage().url;
    const user = auth?.user;

    // Hide sidebar on chat pages to give chat full width
    if (currentUrl.startsWith('/chat')) {
        return null;
    }
    const getInitials = useInitials();
    const [users, setUsers] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/users-list');
                const data = await res.json();
                setUsers(data);
            } catch {}
            try {
                const res = await fetch('/popular-hashtags');
                const data = await res.json();
                setHashtags(data);
            } catch {}
        }
        fetchData();
    }, [user]);

    const handleFollow = (userId) => {
        setFollowingIds((prev) => new Set([...prev, userId]));
        router.post(`/user/${users.find((u) => u.id === userId)?.username}/follow`, {}, {
            preserveScroll: true,
            onError: () => {
                setFollowingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            },
        });
    };

    return (
        <aside className="fixed top-16 right-0 hidden h-[calc(100vh-4rem)] w-[17rem] overflow-y-auto p-3 lg:block">
            <div className="flex flex-col gap-3">
                {/* Who to follow */}
                {users.length > 0 && (
                    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <UserPlus className="h-4 w-4 text-blue-500" />
                            {translations['Who to follow'] || 'Who to follow'}
                        </div>
                        <div className="flex flex-col gap-3">
                            {users.map((u) => {
                                const isFollowed = followingIds.has(u.id);
                                return (
                                    <div key={u.id} className="flex items-center gap-2.5">
                                        <Link href={`/user/${u.username}`} className="shrink-0">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={getProfileImageUrl(u)} alt={u.name} />
                                                <AvatarFallback className="bg-gray-200 text-xs text-black dark:bg-gray-700 dark:text-white">
                                                    {getInitials(u.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div className="min-w-0 flex-1">
                                            <Link href={`/user/${u.username}`} className="flex items-center gap-1">
                                                <span className="truncate text-sm font-medium text-gray-900 hover:underline dark:text-white">
                                                    {u.name}
                                                </span>
                                                {u.is_verified && (
                                                    <span className="flex shrink-0 items-center rounded-full bg-blue-500 p-0.5 text-white">
                                                        <Check className="h-2.5 w-2.5" />
                                                    </span>
                                                )}
                                            </Link>
                                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                                        </div>
                                        <button
                                            onClick={() => handleFollow(u.id)}
                                            disabled={isFollowed}
                                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                                                isFollowed
                                                    ? 'bg-gray-100 text-gray-400 dark:bg-neutral-800 dark:text-gray-500'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                                            }`}
                                        >
                                            {isFollowed
                                                ? (translations['Followed'] || 'Followed')
                                                : (translations['Follow'] || 'Follow')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <Link
                            href="/dashboard/users"
                            className="mt-3 block text-center text-xs text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400"
                        >
                            {translations['Show more'] || 'Show more'}
                        </Link>
                    </div>
                )}

                {/* Popular hashtags */}
                {hashtags.length > 0 && (
                    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                        <Link href="/show-popular-hashtags" className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline dark:text-white">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            {translations['Trending'] || 'Trending'}
                        </Link>
                        <div className="flex flex-col gap-2">
                            {hashtags.map((hashtag) => (
                                <Link
                                    key={hashtag.id}
                                    href={`/posts-by-hashtag/${hashtag.hashtag}`}
                                    className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">
                                            #{hashtag.hashtag}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                                        {hashtag.uses_count} {hashtag.uses_count === 1 ? 'post' : 'posts'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                        <Link
                            href="/show-popular-hashtags"
                            className="mt-3 block text-center text-xs text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400"
                        >
                            {translations['Show more'] || 'Show more'}
                        </Link>
                    </div>
                )}

                {/* Footer */}
                <div className="px-2 text-[11px] text-gray-400 dark:text-gray-600">
                    <span>Spark &copy; {new Date().getFullYear()}</span>
                </div>
            </div>
        </aside>
    );
}
