import { usePage, Link, Head, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';

export default function Followers() {
    const { title, users, user, auth, translations } = usePage().props;
    const getInitials = useInitials();

    const handleFollowToggle = (targetUser, isFollowed) => {
        const action = isFollowed ? 'unfollow' : 'follow';
        router.post(`/user/${targetUser.username}/${action}`, {}, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['users'] }),
        });
    };

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
                            <li key={follower.id} className="flex items-center gap-3 py-2 border-b dark:border-gray-700">
                                <Avatar className="h-24 w-24 border-4 border-white sm:h-28 sm:w-28 dark:border-gray-900">
                                    <AvatarImage src={follower.profile_image_url} alt={follower.name} />
                                    <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(follower.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex w-full items-center">
                                    <div>
                                        <Link href={`/user/${follower.username}`} className="font-medium text-blue-500 hover:underline">
                                            {follower.name}
                                        </Link>
                                        <p className="text-gray-500 dark:text-gray-400">@{follower.username}</p>
                                    </div>
                                    {auth.user.id !== follower.id && (
                                        <button
                                            onClick={() => handleFollowToggle(follower, follower.is_followed)}
                                            className={`ml-auto px-4 py-2 rounded-md text-white ${
                                                follower.is_followed
                                                    ? 'bg-gray-600 hover:bg-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700'
                                                    : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600'
                                            }`}
                                        >
                                            {follower.is_followed ? translations['Unfollow'] : translations['Follow']}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
