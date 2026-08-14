import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, FileText, Hash, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../components/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useInitials } from '../hooks/use-initials';
import AppLayout from '../layouts/app-layout';
import { getProfileImageUrl } from '../lib/utils';
import PostComponent from './post/post-component';

export default function SearchPage() {
    const { query: initialQuery, tab, posts = [], users = [], hashtags = [], translations = {} } = usePage().props;
    const [searchText, setSearchText] = useState(initialQuery || '');
    const getInitials = useInitials();

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchText.trim()) return;
        router.get('/search', { q: searchText.trim(), tab }, { preserveState: true });
    };

    const switchTab = (newTab) => {
        router.get('/search', { q: initialQuery, tab: newTab }, { preserveState: true });
    };

    const tabs = [
        { key: 'posts', label: translations['Posts'], icon: FileText },
        { key: 'users', label: translations['Users'] || 'Users', icon: Users },
        { key: 'hashtags', label: translations['Hashtags'] || 'Hashtags', icon: Hash },
    ];

    return (
        <AppLayout>
            <Head title={initialQuery ? `${translations['Search']}: ${initialQuery}` : translations['Search']} />

            <div className="border-b border-gray-200 p-6 dark:border-neutral-800">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder={translations['Search posts, users, hashtags...']}
                            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="cursor-pointer rounded-full bg-blue-600 px-5 py-2.5 text-sm text-white transition hover:bg-blue-700"
                    >
                        {translations['Search']}
                    </button>
                </form>
            </div>

            <div className="flex flex-wrap gap-2 px-6 py-3">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => switchTab(key)}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            tab === key ? 'bg-brand text-brand-foreground shadow-sm' : 'bg-accent text-accent-foreground hover:bg-accent/70'
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            <div>
                {!initialQuery && (
                    <EmptyState
                        icon={Search}
                        title={translations['Search for anything']}
                        description={translations['Find posts, users, and hashtags']}
                    />
                )}

                {initialQuery && tab === 'posts' && (
                    <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                        {posts.length > 0 ? (
                            posts.map((post) => <PostComponent key={post.id} post={post} />)
                        ) : (
                            <EmptyState icon={FileText} title={translations['No posts found.']} />
                        )}
                    </div>
                )}

                {initialQuery && tab === 'users' && (
                    <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/user/${user.username}`}
                                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900"
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={getProfileImageUrl(user)} alt={user.name} />
                                        <AvatarFallback className="bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <span className="truncate font-semibold text-gray-900 dark:text-white">{user.name}</span>
                                            {user.is_verified && (
                                                <span className="flex items-center rounded-full bg-blue-500 p-0.5 text-xs text-white">
                                                    <Check className="h-3 w-3" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {user.followers_count} {translations['Followers'] || 'followers'}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <EmptyState icon={Users} title={translations['No users found.']} />
                        )}
                    </div>
                )}

                {initialQuery && tab === 'hashtags' && (
                    <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                        {hashtags.length > 0 ? (
                            hashtags.map((tag) => (
                                <Link
                                    key={tag.id}
                                    href={`/posts-by-hashtag/${tag.hashtag}`}
                                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                                            <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">#{tag.hashtag}</span>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {tag.posts_count} {translations['Posts'] || 'posts'}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <EmptyState icon={Hash} title={translations['No hashtags found.']} />
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
