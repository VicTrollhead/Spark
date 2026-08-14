import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { PostSkeleton } from '../../components/post-skeleton';
import { useInfiniteScroll } from '../../hooks/use-infinite-scroll';
import AppLayout from '../../layouts/app-layout.jsx';
import PostComponent from './post-component.jsx';

export default function PostsByHashtag() {
    const { user, posts: initialPosts = { data: [], next_page_url: null }, hashtag, translations = {} } = usePage().props;
    const [posts, setPosts] = useState(initialPosts.data);
    const [nextPageUrl, setNextPageUrl] = useState(initialPosts.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);

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
                    // Restore clean URL so refresh doesn't land on ?page=N
                    window.history.replaceState({}, '', `/posts-by-hashtag/${hashtag.hashtag}`);
                },
                onError: () => setLoadingMore(false),
            },
        );
    }, [nextPageUrl, loadingMore, hashtag.hashtag]);

    const sentinelRef = useInfiniteScroll(loadMore, !!nextPageUrl && !loadingMore);

    return (
        <AppLayout>
            <Head title={`${translations['Posts by hashtag']} #${hashtag.hashtag}`} />

            <div className="border-border border-b p-6">
                <h1 className="text-2xl font-bold break-all">
                    {`${translations['Posts by hashtag']}  `}
                    <span className="bg-brand-gradient bg-clip-text text-transparent">{`#${hashtag.hashtag}`}</span>
                </h1>
            </div>

            <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="px-6 py-4 text-gray-500 dark:text-gray-400">{translations['No posts by hashtag yet.']}</p>
                )}
            </div>

            {loadingMore && (
                <>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </>
            )}
            <div ref={sentinelRef} className="h-1" />
        </AppLayout>
    );
}
