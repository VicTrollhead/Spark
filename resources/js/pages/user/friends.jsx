import { usePage, Link, Head, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
export default function Friends() {
    const { title, users, user, auth } = usePage().props;
    const getInitials = useInitials();
    const isOwnProfile = auth.user && auth.user.id === user.id;

    const breadcrumbs = [
        { title: isOwnProfile ? 'My Profile' : "@" + user.username + "'s Profile", href: `/user/${user.username}` },
        { title:  'Friends', href: `/user/${user.username}` },
    ];

    const handleFollow = (user) => {
        router.post(`/user/${user.username}/unfollow`, {}, {
            onSuccess: () => {
                router.reload({ only: ['posts'] });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isOwnProfile ? 'Friends' : user.name + "'s Friends"} />
            <div className="max-w-lg p-6">
                <h1 className="mb-4 text-2xl font-bold">{title}</h1>
                {users.length === 0 ? (
                    <p className="text-gray-500">Not friends anyone yet.</p>
                ) : (
                    <ul>
                        {users.map((user) => (
                            <li key={user.id} className="flex items-center gap-3 border-b py-2 dark:border-gray-700">
                                <Avatar className="h-24 w-24 border-4 border-white sm:h-28 sm:w-28 dark:border-gray-900">
                                    <AvatarImage src={user.profile_image_url} alt={user.name} />
                                    <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-row w-full">
                                    <div>
                                        <Link href={`/user/${user.username}`} className="font-medium text-blue-500 hover:underline">
                                            {user.name}
                                        </Link>
                                        <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                                    </div>
                                    <button
                                        onClick={() => handleFollow(user)}
                                        className={`ml-auto px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white dark:bg-gray-800 dark:hover:bg-gray-700`}>
                                        Unfollow
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
