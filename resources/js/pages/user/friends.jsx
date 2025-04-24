import { usePage, Link, Head, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
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

    const handleFollow = (user) => {
        router.post(`/user/${user.username}/unfollow`, {}, {
            onSuccess: () => {
                router.reload({ only: ['users'] });
            }
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
                        {users.map((user) => (
                            <li key={user.id} className="flex items-center gap-3 border-b py-2 mt-2 dark:border-gray-700">
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
                                        className={`ml-auto px-4 py-1 rounded-md bg-gray-600 hover:bg-gray-500 text-white dark:bg-gray-800 dark:hover:bg-gray-700`}>
                                        {translations['Unfollow']}
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
