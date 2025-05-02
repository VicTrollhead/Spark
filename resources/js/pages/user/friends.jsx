import { usePage, Link, Head, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';

export default function Friends() {
    const { users, user, auth, translations } = usePage().props;
    const getInitials = useInitials();
    const [isLoading, setIsLoading] = useState(false);

    const handleReload = () => {
        setIsLoading(true);
        router.reload();
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    const handleFollowToggle = (targetUser, isFollowed, isPrivate, hasSentRequest) => {
        let action;
        if (isFollowed) {
            action = 'unfollow';
        } else if (isPrivate && !isFollowed) {
            action = 'follow-request';
        } else {
            action = 'follow';
        }

        router.post(`/user/${targetUser.username}/${action}`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['users'] });
            },
        });
    };

    return (
        <AppLayout>
            <Head title={translations['Friends']} />
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{translations['Friends']}</h1>
                    <button
                        onClick={handleReload}
                        className="p-2 text-sm font-semibold dark:text-white text-gray-800 border rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 transition flex items-center"
                    >
                        <RefreshCw
                            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                        />
                    </button>
                </div>

                {users.length === 0 ? (
                    <p className="text-gray-500 mt-1">{translations['Not friends anyone yet.']}</p>
                ) : (
                    <ul>
                        {users.map((friend) => (
                            <li key={friend.id} className="flex items-center gap-3 border-b py-2 mt-2 dark:border-gray-700">
                                <Avatar className="h-24 w-24 border-4 border-white sm:h-28 sm:w-28 dark:border-gray-900">
                                    <AvatarImage src={friend.profile_image_url} alt={friend.name} />
                                    <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(friend.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-row w-full">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <Link href={`/user/${friend.username}`} className="font-medium text-blue-500 hover:underline">
                                                {friend.name}
                                            </Link>
                                            {friend.is_verified && (
                                                <span className="group relative">
                                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                                        Verified
                                                    </span>
                                                    <span className="flex items-center rounded-md bg-blue-500 p-0.5 text-xs font-medium text-white">
                                                        <Check className="h-4 w-4" />
                                                    </span>
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-500 dark:text-gray-400">@{friend.username}</p>
                                    </div>
                                    <button
                                        onClick={() => handleFollowToggle(friend, friend.is_followed, friend.is_private, friend.has_sent_follow_request)}
                                        className={`ml-auto px-4 py-1 rounded-md ${
                                            friend.has_sent_follow_request
                                                ? 'bg-gray-600 hover:bg-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700'
                                                : (friend.is_followed
                                                    ? 'bg-gray-600 hover:bg-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700'
                                                    : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600')
                                        } text-white`}
                                    >
                                        {friend.is_private && !friend.is_followed && !friend.has_sent_follow_request
                                            ? translations['Send Follow Request']
                                            : (friend.has_sent_follow_request && !friend.is_followed
                                                ? translations['Request Sent']
                                                : (friend.is_followed
                                                    ? translations['Unfollow']
                                                    : translations['Follow']))
                                        }
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
