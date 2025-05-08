import { usePage, Link, Head, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import { useState } from 'react';
import { Check, SendIcon } from 'lucide-react';
import { getProfileImageUrl } from '../../lib/utils';

export default function Followers() {
    const { title, users: initialUsers, user, auth, translations } = usePage().props;
    const getInitials = useInitials();
    const [users, setUsers] = useState(initialUsers);
    const [hasSentRequest, setHasSentRequest] = useState(user.has_sent_follow_request);

    const handleFollowToggle = (targetUser, isFollowed) => {
        let action;
        if (isFollowed) {
            action = 'unfollow';
        } else if (targetUser.is_private && !isFollowed) {
            action = 'follow-request';
        } else {
            action = 'follow';
        }

        router.post(`/user/${targetUser.username}/${action}`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setUsers(prevUsers =>
                    prevUsers.map(u =>
                        u.id === targetUser.id
                            ? {
                                ...u,
                                is_followed: action === 'follow',
                                has_sent_follow_request: action === 'follow-request',
                            }
                            : u
                    )
                );
            },
        });
    };

    // const getProfileImageUrl = (user) => {
    //     if (user?.profile_image?.disk === 's3') {
    //         return user.profile_image?.url;
    //     } else if (user?.profile_image?.file_path) {
    //         return `/storage/${user.profile_image?.file_path}`;
    //     }
    //     return null;
    // };

    return (
        <AppLayout>
            <Head title={translations['Followers']} />
            <div className="px-6">
                <h1 className="text-2xl font-bold my-6">{translations['Followers']}</h1>
                {users.length === 0 ? (
                    <p className="text-gray-500">{translations['No followers yet.']}</p>
                ) : (
                    <ul>
                        {users.map((follower) => (
                            <li key={follower.id} className="flex items-center gap-3 py-4 border-b dark:border-gray-700">
                                <Avatar className="h-24 w-24 border-4 border-white sm:h-28 sm:w-28 dark:border-gray-900">
                                    <AvatarImage src={getProfileImageUrl(follower)} alt={follower.name} />
                                    <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(follower.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col w-full ">
                                    <div className="flex items-center gap-2 justify-between">
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <Link href={`/user/${follower.username}`} className="font-medium text-blue-500 hover:underline">
                                                    {follower.name}
                                                </Link>
                                                {follower.is_verified && (
                                                    <div className="group relative">
                                                    <span className="absolute -top-7 left-1/2 top -translate-x-1/2 scale-0 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                                        Verified
                                                    </span>
                                                        <span className="flex items-center rounded-lg bg-blue-500 p-0.5 text-xs font-medium text-white">
                                                        <Check className="h-3 w-3" />
                                                    </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400">@{follower.username}</p>
                                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                                {follower.followers_count} {translations['Subscribers']}
                                            </p>
                                            {follower.is_friend && (
                                                <p className="text-green-500 text-sm font-medium mt-1">
                                                    {translations['You follow each other']}
                                                </p>
                                            )}
                                        </div>

                                        {auth.user.id !== follower.id && (
                                            <div className="flex lg:flex-row flex-col gap-1">
                                                {follower.is_friend ? (
                                                    <button
                                                        onClick={() => router.post(`/chat/user-chat/new/${follower.id}`)}
                                                        className={`px-4 py-2 flex gap-2 items-center rounded-md bg-gray-600 hover:bg-gray-500 text-white dark:bg-gray-800 dark:hover:bg-gray-700`}
                                                    >
                                                        {translations['Write']}<SendIcon className="w-5 h-5" />
                                                    </button>
                                                ) : ''}
                                                <button
                                                    onClick={() => handleFollowToggle(follower, follower.is_followed || follower.has_sent_follow_request)}
                                                    className={`ml-auto px-4 py-2 rounded-md text-white ${
                                                        follower.has_sent_follow_request
                                                            ? 'bg-gray-600 hover:bg-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700'
                                                            : (follower.is_followed
                                                                ? 'bg-gray-600 hover:bg-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700'
                                                                : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600')
                                                    }`}
                                                >
                                                    {follower.is_private && !follower.is_followed && !follower.has_sent_follow_request
                                                        ? translations['Send Follow Request']
                                                        : (follower.has_sent_follow_request && !follower.is_followed
                                                            ? translations['Request Sent']
                                                            : (follower.is_followed
                                                                ? translations['Unfollow']
                                                                : translations['Follow']))
                                                    }
                                                </button>
                                            </div>

                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}

