import { Head, router, usePage } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { PostSkeleton } from '../../components/post-skeleton';
import { useInfiniteScroll } from '../../hooks/use-infinite-scroll';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';

export default function Reposts() {
    const { user, posts: initialPosts = { data: [], next_page_url: null }, translations = {}, filters = {} } = usePage().props;

    const [posts, setPosts] = useState(initialPosts.data);
    const [nextPageUrl, setNextPageUrl] = useState(initialPosts.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleReload = () => {
        setIsLoading(true);
        router.reload({
            only: ['posts'],
            onSuccess: (page) => {
                setPosts(page.props.posts.data);
                setNextPageUrl(page.props.posts.next_page_url);
                setIsLoading(false);
            },
            onError: () => setIsLoading(false),
        });
    };

    const handleSortChange = (e) => {
        router.get(
            route('user.reposts', { username: user.username }),
            {
                sort: e.target.value,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setPosts(page.props.posts.data);
                    setNextPageUrl(page.props.posts.next_page_url);
                },
            },
        );
    };

    const loadMore = useCallback(() => {
        if (!nextPageUrl || loadingMore) return;
        setLoadingMore(true);
        router.get(
            nextPageUrl,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['posts'],
                onSuccess: (page) => {
                    setPosts((prev) => [...prev, ...page.props.posts.data]);
                    setNextPageUrl(page.props.posts.next_page_url);
                    setLoadingMore(false);
                },
                onError: () => setLoadingMore(false),
            },
        );
    }, [nextPageUrl, loadingMore]);

    const sentinelRef = useInfiniteScroll(loadMore, !!nextPageUrl && !loadingMore);

    return (
        <AppLayout>
            <Head title={translations['Reposts']} />

            <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-neutral-800">
                <h1 className="text-2xl font-bold">{translations['Reposts']}</h1>

                <div className="flex items-center gap-2">
                    <select
                        className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        value={filters.sort}
                        onChange={handleSortChange}
                    >
                        <option value="latest">{translations['Latest']}</option>
                        <option value="oldest">{translations['Oldest']}</option>
                        <option value="most_liked">{translations['Most Liked']}</option>
                        <option value="reposted_friends">{translations['People I Follow']}</option>
                    </select>
                    <button
                        onClick={handleReload}
                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="px-6 py-4 text-gray-600 dark:text-gray-300">{translations['No reposts yet.']}</p>
                )}
            </div>

            {loadingMore && (
                <>
                    <PostSkeleton />
                    <PostSkeleton />
                </>
            )}
            <div ref={sentinelRef} className="h-1" />
        </AppLayout>
    );
}
