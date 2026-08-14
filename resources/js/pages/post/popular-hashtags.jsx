import { Head, Link, router, usePage } from '@inertiajs/react';
import { Hash, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../../components/empty-state';
import AppLayout from '../../layouts/app-layout.jsx';

export default function PopularHashtags() {
    const { hashtags = [], sort, translations = {} } = usePage().props;
    const [isLoading, setIsLoading] = useState(false);

    const handleReload = () => {
        setIsLoading(true);
        router.reload({ onFinish: () => setIsLoading(false) });
    };

    const handleSortChange = (e) => {
        router.get(route('showPopularHashtags'), { sort: e.target.value }, { preserveScroll: true, preserveState: true });
    };

    return (
        <AppLayout>
            <Head title={translations['Popular hashtags']} />

            <div className="border-b border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between p-6">
                    <div>
                        <h1 className="text-2xl font-bold">{translations['Popular hashtags']}</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{translations['Explore trending topics by post engagement.']}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={sort}
                            onChange={handleSortChange}
                            className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        >
                            <option value="likes">{translations['Most Liked']}</option>
                            <option value="posts">{translations['Most Posts']}</option>
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

            {hashtags.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                    {hashtags.map((hashtag) => (
                        <Link
                            key={hashtag.id}
                            href={`/posts-by-hashtag/${hashtag.hashtag}`}
                            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400">
                                    <Hash className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-semibold text-blue-500">#{hashtag.hashtag}</h2>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
                                <span>
                                    {hashtag.posts_count} {translations['Posts']}
                                </span>
                                <span>
                                    {hashtag.total_likes} {translations['Likes']}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-16">
                    <EmptyState icon={Hash} title={translations['No popular hashtags found.']} />
                </div>
            )}
        </AppLayout>
    );
}
