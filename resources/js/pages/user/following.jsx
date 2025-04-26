import { usePage, Link, Head, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';

export default function Following() {
    const { title, users, user, auth, translations } = usePage().props;
    const getInitials = useInitials();
    const isOwnProfile = auth.user && auth.user.id === user.id;

    const handleFollowToggle = (targetUser, isFollowed) => {
        const action = isFollowed ? 'unfollow' : 'follow';
        router.post(`/user/${targetUser.username}/${action}`, {}, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['users'] }),
        });
    };


    return (
        <AppLayout>
            <Head title={translations['Following']} />
            <div className="px-6">
                <h1 className="my-6 text-2xl font-bold">{translations['Following']}</h1>
                {users.length === 0 ? (
                    <p className="text-gray-500">{translations['Not following anyone yet.']}</p>
                ) : (
                    <ul>
                        {users.map((followee) => (
                            <li key={followee.id} className="flex items-center gap-3 border-b py-2 dark:border-gray-700">
                                <Avatar className="h-24 w-24 border-4 border-white sm:h-28 sm:w-28 dark:border-gray-900">
                                    <AvatarImage src={followee.profile_image_url} alt={followee.name} />
                                    <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(followee.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex w-full items-center">
                                    <div>
                                        <Link href={`/user/${followee.username}`} className="font-medium text-blue-500 hover:underline">
                                            {followee.name}
                                        </Link>
                                        <p className="text-gray-500 dark:text-gray-400">@{followee.username}</p>
                                    </div>
                                    {auth.user.id !== followee.id && (
                                        <button
                                            onClick={() => handleFollowToggle(followee, followee.is_followed)}
                                            className={`ml-auto px-4 py-2 rounded-md text-white ${
                                                followee.is_followed
                                                    ? 'bg-gray-600 hover:bg-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700'
                                                    : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600'
                                            }`}
                                        >
                                            {followee.is_followed ? translations['Unfollow'] : translations['Follow']}
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
