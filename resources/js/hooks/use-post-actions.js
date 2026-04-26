import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

export function usePostActions(post) {
    const { translations = {} } = usePage().props;

    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [isFavorited, setIsFavorited] = useState(post.is_favorited);
    const [favoritesCount, setFavoritesCount] = useState(post.favorites_count);
    const [isReposted, setIsReposted] = useState(post.is_reposted);
    const [repostsCount, setRepostsCount] = useState(post.reposts_count);

    useEffect(() => {
        setIsLiked(post.is_liked);
        setLikesCount(post.likes_count);
        setIsFavorited(post.is_favorited);
        setFavoritesCount(post.favorites_count);
        setIsReposted(post.is_reposted);
        setRepostsCount(post.reposts_count);
    }, [post]);

    // Listen for engagement changes from other users via WebSocket
    useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.private(`post.${post.id}`);
        const handler = (e) => {
            setLikesCount(e.likes_count);
            setFavoritesCount(e.favorites_count);
            setRepostsCount(e.reposts_count);
        };
        channel.listen('PostEngagementChanged', handler);
        return () => {
            channel.stopListening('PostEngagementChanged', handler);
        };
    }, [post.id]);

    const handleLike = async () => {
        const wasLiked = isLiked;
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
        const action = isLiked ? `/unlike` : `/like`;
        await router.post(
            action,
            { type: 'post', id: post.id },
            {
                preserveScroll: true,
                onSuccess: () => {},
                onError: () => {
                    setIsLiked(post.is_liked);
                    setLikesCount(post.likes_count);
                    toast.error(translations['Something went wrong']);
                },
            },
        );
    };

    const handleFavorite = async () => {
        const wasFavorited = isFavorited;
        setIsFavorited(!isFavorited);
        setFavoritesCount(isFavorited ? favoritesCount - 1 : favoritesCount + 1);
        await router.post(
            isFavorited ? `/post/${post.slug}/remove-favorite` : `/post/${post.slug}/add-favorite`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(wasFavorited ? translations['Removed from favorites'] : translations['Added to favorites']);
                },
                onError: () => {
                    setIsFavorited(post.is_favorited);
                    setFavoritesCount(post.favorites_count);
                    toast.error(translations['Something went wrong']);
                },
            },
        );
    };

    const handleRepost = async () => {
        if (post.is_private || post.user.is_private) {
            toast.error(translations['You cannot repost private posts.']);
            return;
        }
        const wasReposted = isReposted;
        setIsReposted(!isReposted);
        setRepostsCount(isReposted ? repostsCount - 1 : repostsCount + 1);
        await router.post(
            isReposted ? `/post/${post.slug}/undo` : `/post/${post.slug}/repost`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(wasReposted ? translations['Repost removed'] : translations['Reposted!']);
                },
                onError: () => {
                    setIsReposted(post.is_reposted);
                    setRepostsCount(post.reposts_count);
                    toast.error(translations['Something went wrong']);
                },
            },
        );
    };

    return {
        isLiked, likesCount,
        isFavorited, favoritesCount,
        isReposted, repostsCount,
        handleLike, handleFavorite, handleRepost,
    };
}
