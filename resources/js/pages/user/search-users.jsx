import { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import { Check, RefreshCw, Search, Users } from 'lucide-react';
import { useInitials } from '../../hooks/use-initials.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar.jsx';
import { EmptyState } from '../../components/empty-state';
import { getProfileImageUrl } from '../../lib/utils';

export default function SearchUsers() {
    const { users = [], sort, searchText, translations = {} } = usePage().props;
    const [sortOption, setSortOption] = useState(sort || 'latest');
    const [searchTextOption, setSearchTextOption] = useState(searchText || '');
    const [usersList, setUsersList] = useState(users || []);
    const getInitials = useInitials();
    const [isLoading, setIsLoading] = useState(false);

    const handleSortChange = (e) => {
        const selectedSort = e.target.value;
        setSortOption(selectedSort);
        if (!searchTextOption) {
            setUsersList([]);
            return;
        }
        router.get(`/user/search/${searchTextOption}`, { sort: selectedSort }, { preserveScroll: true });
    };

    const onKeyDownSearch = async (e) => {
        if (e.code === 'Enter') {
            const searchText = e.currentTarget.value;
            setSearchTextOption(searchText);
            if (!searchText) {
                setUsersList([]);
                return;
            }
            router.get(`/user/search/${searchTextOption}`, { sort: `${sortOption}` }, { preserveScroll: true });
        }
    };

    const handleReload = () => {
        setIsLoading(true);
        if (searchTextOption)
            router.reload({ only: ['users'] });
        setTimeout(() => {
            if (searchTextOption)
                setUsersList(users);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <AppLayout>
            <Head title={translations['Search users']} />

            <div className="border-b border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between p-6">
                    <h1 className="text-2xl font-bold">{translations['Search users']}</h1>
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

                <div className="px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={translations['Search users by name or username']}
                            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                            value={searchTextOption}
                            onChange={(e) => setSearchTextOption(e.target.value)}
                            onKeyDown={onKeyDownSearch}
                        />
                    </div>
                </div>
            </div>

            {usersList.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                    {usersList.map((user) => (
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
                    <EmptyState icon={Users} title={translations['No users found.']} />
                </div>
            )}
        </AppLayout>
    );
}
