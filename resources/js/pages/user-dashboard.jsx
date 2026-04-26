import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, RefreshCw, Users } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { EmptyState } from '../components/empty-state';
import { useInitials } from '../hooks/use-initials';
import AppLayout from '../layouts/app-layout';
import { getProfileImageUrl } from '../lib/utils';

export default function Dashboard() {
    const { users = [], sort, translations = {} } = usePage().props;
    const [sortOption, setSortOption] = useState(sort || 'latest');
    const getInitials = useInitials();
    const [isLoading, setIsLoading] = useState(false);

    const handleSortChange = (e) => {
        const selectedSort = e.target.value;
        setSortOption(selectedSort);
        router.get('/dashboard/users', { sort: selectedSort }, { preserveScroll: true });
    };

    const handleReload = () => {
        setIsLoading(true);
        router.reload({ onFinish: () => setIsLoading(false) });
    };

    return (
        <AppLayout>
            <Head title={translations['All users']} />

            <div className="border-b border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between p-6">
                    <h1 className="text-2xl font-bold">{translations['All users']}</h1>
                    <div className="flex items-center gap-2">
                        <select
                            value={sortOption}
                            onChange={handleSortChange}
                            className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        >
                            <option value="latest">{translations['Latest']}</option>
                            <option value="oldest">{translations['Oldest']}</option>
                            <option value="popular">{translations['Most Followed']}</option>
                            <option value="least_followed">{translations['Least Followed']}</option>
                            <option value="following">{translations['Following']}</option>
                            <option value="followers">{translations['Followers']}</option>
                            <option value="mutual_subscribers">{translations['Friends']}</option>
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

            {users.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                    {users.map((user) => (
                        <Link
                            key={user.id}
                            href={`/user/${user.username}`}
                            className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900"
                        >
                            <Avatar className="h-12 w-12 shrink-0">
                                <AvatarImage src={getProfileImageUrl(user)} alt={user.name} />
                                <AvatarFallback className="rounded-full bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate font-semibold text-gray-900 dark:text-white">{user.name}</span>
                                    {user.is_verified && (
                                        <span className="inline-flex items-center rounded-full bg-blue-500 p-0.5 text-white">
                                            <Check className="h-2.5 w-2.5" />
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-16">
                    <EmptyState icon={Users} title={translations['No users found for this sorting option.']} />
                </div>
            )}
        </AppLayout>
    );
}
