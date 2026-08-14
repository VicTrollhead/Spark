import { Head, router, usePage } from '@inertiajs/react';
import { Check, RefreshCw, SendIcon, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../../components/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import { getProfileImageUrl } from '../../lib/utils';

export default function Friends() {
    const { users = [], user, auth, translations = {}, filters = {} } = usePage().props;
    const getInitials = useInitials();
    const [isLoading, setIsLoading] = useState(false);

    const handleReload = () => {
        setIsLoading(true);
        router.reload({ onFinish: () => setIsLoading(false) });
    };

    const handleFollowToggle = (targetUser, isFollowed) => {
        let action;
        if (isFollowed) {
            action = 'unfollow';
        } else if (targetUser.is_private && !isFollowed) {
            action = 'follow-request';
        } else {
            action = 'follow';
        }

        router.post(
            `/user/friends/${action}`,
            { user_id: targetUser.id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['users'] });
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title={translations['Friends']} />

            <div className="border-b border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between p-6">
                    <h1 className="text-2xl font-bold">{translations['Friends']}</h1>
                    <div className="flex items-center gap-2">
                        <select
                            className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                            value={filters?.sort || 'latest'}
                            onChange={(e) => {
                                router.get(route('user.friends'), { sort: e.target.value }, { preserveScroll: true, preserveState: true });
                            }}
                        >
                            <option value="latest">{translations['Latest']}</option>
                            <option value="oldest">{translations['Oldest']}</option>
                            <option value="popular">{translations['Most Followed']}</option>
                            <option value="least_followers">{translations['Least Followed']}</option>
                        </select>
                        <button
                            onClick={handleReload}
                            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {users.length === 0 ? (
                <div className="py-16">
                    <EmptyState icon={Users} title={translations['No friends yet.']} />
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                    {users.map((friend) => (
                        <div
                            key={friend.id}
                            onClick={() => router.visit(`/user/${friend.username}`)}
                            className="cursor-pointer px-4 py-4 transition-colors hover:bg-gray-50 sm:px-6 dark:hover:bg-neutral-900"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-11 w-11 shrink-0">
                                    <AvatarImage src={getProfileImageUrl(friend)} alt={friend.name} />
                                    <AvatarFallback className="rounded-full bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(friend.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate font-semibold text-gray-900 dark:text-white">{friend.name}</span>
                                        {friend.is_verified && (
                                            <span className="inline-flex items-center rounded-full bg-blue-500 p-0.5 text-white">
                                                <Check className="h-2.5 w-2.5" />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{friend.username}</p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => router.post(`/chat/user-chat/new/${friend.id}`)}
                                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                                        title={translations['Write']}
                                    >
                                        <SendIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleFollowToggle(friend, friend.is_followed)}
                                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 ${
                                            friend.is_followed
                                                ? 'border border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-neutral-600 dark:text-gray-300 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-400'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                    >
                                        {friend.is_followed ? translations['Unfollow'] : translations['Follow']}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-1 ml-14 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                                <span>
                                    {friend.followers_count} {translations['Followers']}
                                </span>
                                <span className="font-medium text-green-500">{translations['You follow each other']}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
