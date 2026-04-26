import { Head, router, usePage } from '@inertiajs/react';
import '../../echo';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useInfiniteScroll } from '../../hooks/use-infinite-scroll';
import { PostSkeleton } from '../../components/post-skeleton';

export default function FollowingPosts() {
    const { auth, user, posts: initialPosts = { data: [], next_page_url: null }, translations = {}, filters = {} } = usePage().props;
    const [posts, setPosts] = useState(initialPosts.data);
    const [nextPageUrl, setNextPageUrl] = useState(initialPosts.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newPostsQueue, setNewPostsQueue] = useState([]);

    // Listen for new posts from followed users
    useEffect(() => {
        if (!auth?.user?.id) return;
        const channel = window.Echo.private(`feed.${auth.user.id}`);
        channel.listen('PostCreated', (e) => {
            setNewPostsQueue((prev) => {
                if (prev.some((p) => p.id === e.post.id)) return prev;
                return [e.post, ...prev];
            });
        });
        return () => {
            window.Echo.leave(`feed.${auth.user.id}`);
        };
    }, [auth?.user?.id]);

    const showNewPosts = () => {
        setPosts((prev) => [...newPostsQueue, ...prev]);
        setNewPostsQueue([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSortChange = (e) => {
        router.get(route('user.followingPosts', { username: user.username }), {
            sort: e.target.value,
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                setPosts(page.props.posts.data);
                setNextPageUrl(page.props.posts.next_page_url);
            },
        });
    };

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

    const loadMore = useCallback(() => {
        if (!nextPageUrl || loadingMore) return;
        setLoadingMore(true);
        router.get(nextPageUrl, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['posts'],
            onSuccess: (page) => {
                setPosts((prev) => [...prev, ...page.props.posts.data]);
                setNextPageUrl(page.props.posts.next_page_url);
                setLoadingMore(false);
            },
            onError: () => setLoadingMore(false),
        });
    }, [nextPageUrl, loadingMore]);

    const sentinelRef = useInfiniteScroll(loadMore, !!nextPageUrl && !loadingMore);

    return (
        <AppLayout>
            <Head title={translations['Following posts']} />

            <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-neutral-800">
                <h1 className="text-2xl font-bold">{translations['Following posts']}</h1>

                <div className="flex items-center gap-2">
                    <select
                        className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        value={filters.sort}
                        onChange={handleSortChange}
                    >
                        <option value="latest">{translations['Latest']}</option>
                        <option value="oldest">{translations['Oldest']}</option>
                        <option value="most_liked">{translations['Most Liked']}</option>
                    </select>
                    <button
                        onClick={handleReload}
                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {newPostsQueue.length > 0 && (
                <button
                    onClick={showNewPosts}
                    className="w-full bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
                >
                    {translations['Show %count% new posts']
                        ? translations['Show %count% new posts'].replace('%count%', newPostsQueue.length)
                        : `Show ${newPostsQueue.length} new post${newPostsQueue.length > 1 ? 's' : ''}`}
                </button>
            )}

            <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">{translations['No following posts yet.']}</p>
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
