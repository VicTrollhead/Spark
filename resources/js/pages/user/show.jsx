import { Head, usePage, Link, router } from '@inertiajs/react';
import '../../echo';
import {Check, Crown, FileText, Flame, Globe, Heart, Calendar, MapPin, Pencil, Pin, RefreshCw, SendIcon, Shield, Sparkles, Star, Trophy, TrendingUp, UserCheck, AlertCircle} from 'lucide-react';
import { EmptyState } from '../../components/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';
import { PostSkeleton } from '../../components/post-skeleton';
import { useInfiniteScroll } from '../../hooks/use-infinite-scroll';
import { useState, useCallback, useEffect } from 'react';
import { getProfileImageUrl, getCoverImageUrl } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function Show() {
    const { user, auth, posts: initialPosts = { data: [], next_page_url: null }, translations = {}, filters = {}, followers_string, following_string, pinned_post, badges = [] } = usePage().props;

    const badgeIcons = {
        'pencil': Pencil,
        'flame': Flame,
        'trophy': Trophy,
        'star': Star,
        'trending-up': TrendingUp,
        'crown': Crown,
        'heart': Heart,
        'sparkles': Sparkles,
        'shield': Shield,
    };
    const getInitials = useInitials();
    const [sort, setSort] = useState(filters?.sort || 'latest');
    const [isLoading, setIsLoading] = useState(false);
    const [hasSentRequest, setHasSentRequest] = useState(user.has_sent_follow_request);
    const [posts, setPosts] = useState(initialPosts.data);
    const [nextPageUrl, setNextPageUrl] = useState(initialPosts.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);
    const [followersCount, setFollowersCount] = useState(user.followers_count);
    const [followingCount, setFollowingCount] = useState(user.following_count);

    // Listen for follow changes on this user's profile
    useEffect(() => {
        const channel = window.Echo.private(`user.${user.id}`);
        channel.listen('FollowChanged', (e) => {
            setFollowersCount(e.follower_count);
            setFollowingCount(e.following_count);
        });
        return () => {
            window.Echo.leave(`user.${user.id}`);
        };
    }, [user.id]);

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
                // Restore clean URL so refresh doesn't land on ?page=N
                window.history.replaceState({}, '', `/user/${user.username}`);
            },
            onError: () => setLoadingMore(false),
        });
    }, [nextPageUrl, loadingMore, user.username]);

    const sentinelRef = useInfiniteScroll(loadMore, !!nextPageUrl && !loadingMore);

    const handleFollow = () => {
        const isCurrentlyFollowing = user.is_following || hasSentRequest;

        const route = isCurrentlyFollowing
            ? 'unfollow'
            : (user.is_private ? 'follow-request' : 'follow');

        setIsLoading(true);

        router.post(`/user/${user.username}/${route}`, {}, {
            onSuccess: () => {
                if (user.is_private && !isCurrentlyFollowing) {
                    setHasSentRequest(true);
                } else {
                    setHasSentRequest(false);
                }
                setIsLoading(false);
            },
            onError: () => {
                setIsLoading(false);
            }
        });
    };


    const handleEditProfile = () => {
        router.get(`/user/${user.username}/edit`);
    };

    const profileImageUrl = getProfileImageUrl(user);
    const coverImageUrl = getCoverImageUrl(user);

    const isOwnProfile = auth.user && auth.user.id === user.id;

    if (!user.canViewFullProfile) {
        return (
            <AppLayout>
                <Head title={`@${user.username} (${translations['Private Account']})`} />

                <div className="p-6 text-center flex flex-col items-center justify-center">
                    <Avatar className="h-24 w-24 mx-auto border-4 border-white dark:border-gray-900">
                        <AvatarImage src={profileImageUrl || ''} alt={user.username} />
                        <AvatarFallback className="rounded-full bg-gray-200 text-4xl text-black dark:bg-gray-700 dark:text-white">
                            {getInitials(user.username)}
                        </AvatarFallback>
                    </Avatar>

                    <h2 className="text-lg font-semibold mt-2 text-gray-600 dark:text-gray-400">@{user.username}</h2>
                    <div className="flex items-center p-2 ml-2">
                        <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">{user.name}</h1>
                        {user.is_verified && (
                            <div className="group relative ml-2">
                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 transform rounded-lg bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                        Verified
                                    </span>
                                    <span className="flex items-center rounded-full bg-blue-500 p-1 text-xs font-medium text-white">
                                        <Check className="h-4 w-4" />
                                    </span>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">{translations['This account is private.']}</p>

                    {auth.user && !user.is_following && (
                        <button
                            onClick={handleFollow}
                            className="mt-4 rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                        >
                            {hasSentRequest ? translations['Request Sent'] : translations['Follow to See More']}
                        </button>
                    )}

                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={`${user.name} (@${user.username})`} />

            <div className="relative w-full bg-gray-200 h-72 dark:bg-gray-700 overflow-visible">
                {coverImageUrl && (
                    <img src={coverImageUrl} alt="Cover Image" className="h-full w-full object-cover object-center" />
                )}
                <div className="absolute bottom-[-40px] left-4 sm:bottom-[-55px] sm:left-6 z-10">
                    <Avatar className="h-32 w-32 border-4 border-white sm:h-36 sm:w-36 dark:border-gray-900">
                        <AvatarImage src={profileImageUrl} alt={user.name} />
                        <AvatarFallback className="rounded-full bg-gray-200 text-5xl text-black dark:bg-gray-700 dark:text-white">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                </div>

            </div>

            <div className="space-y-2 p-4 sm:p-6 pt-12 sm:pt-16 overflow-x-hidden">
                <div className="flex items-center justify-between gap-x-5 min-w-0">
                    <div className="min-w-0">
                        <div className="flex items-center mt-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words min-w-0">{user.name}</h1>
                            {user.is_verified && (
                                <div className="group relative ml-2">
                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 transform rounded-lg bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                        Verified
                                    </span>
                                    <span className="flex items-center rounded-full bg-blue-500 p-1 text-xs font-medium text-white">
                                        <Check className="h-4 w-4" />
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 truncate">@{user.username}</p>
                    </div>
                    {!isOwnProfile && (
                        <div className="flex shrink-0 items-center gap-2">
                            {user.is_friend && (
                                <Link
                                    href={`/chat/user-chat/${user.username}`}
                                    className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800"
                                >
                                    {translations['Message'] || 'Message'}<SendIcon className="h-4 w-4" />
                                </Link>
                            )}
                            <button
                                onClick={handleFollow}
                                className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                                    user.is_following
                                        ? 'border border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-neutral-600 dark:text-gray-300 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-400'
                                        : hasSentRequest
                                            ? 'border border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 dark:border-neutral-600 dark:text-gray-400'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                            >
                                {user.is_following
                                    ? translations['Unfollow']
                                    : hasSentRequest
                                        ? (translations['Request Sent'] || 'Request Sent')
                                        : translations['Follow']}
                            </button>
                        </div>
                    )}
                    {isOwnProfile && (
                        <div className="flex shrink-0 flex-col items-end space-y-2">
                            <button
                                onClick={handleEditProfile}
                                className="rounded-full border border-gray-300 px-5 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800"
                            >
                                {translations['Edit Profile']}
                            </button>

                            {(!user.bio || !user.location || !user.website || !user.date_of_birth) && (
                                <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <p className="leading-tight">
                                        {translations['Complete your profile.']}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {user.bio && <p className="text-gray-700 dark:text-gray-300 break-words">{user.bio}</p>}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {user.location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {user.location}
                        </div>
                    )}

                    {user.website && (
                        <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            <a href={user.website} target="_blank" rel="noopener noreferrer" className="max-w-[200px] truncate text-blue-500 hover:underline sm:max-w-xs">
                                {user.website}
                            </a>
                        </div>
                    )}

                    {user.date_of_birth && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(user.date_of_birth).toLocaleDateString()}
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4" />
                        {translations['Joined']}{' '}{new Date(user.created_at).toLocaleDateString()}
                    </div>

                    {user.status && (
                        <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {translations[user.status]}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <Link href={`/user/${user.username}/followers`} className="rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground transition hover:bg-accent/70">
                        <strong className="font-semibold">{followersCount}</strong>{' '}
                        <span className="text-muted-foreground">{followers_string}</span>
                    </Link>
                    <Link href={`/user/${user.username}/following`} className="rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground transition hover:bg-accent/70">
                        <strong className="font-semibold">{followingCount}</strong>{' '}
                        <span className="text-muted-foreground">{following_string}</span>
                    </Link>
                    <div className="rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground">
                        <strong className="font-semibold">{user.total_likes}</strong>{' '}
                        <span className="text-muted-foreground">{translations['Likes']}</span>
                    </div>
                </div>

                {badges?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {badges.map((badge) => {
                            const Icon = badgeIcons[badge.icon];
                            return (
                                <div
                                    key={badge.key}
                                    className="group relative flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-neutral-800 dark:text-gray-300"
                                >
                                    {Icon && <Icon className="h-3.5 w-3.5" />}
                                    {translations[badge.label] || badge.label}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-neutral-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{translations['Posts']}</h2>

                    <div className="flex items-center gap-2">
                        <select
                            className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value);
                                router.get(window.location.pathname, { sort: e.target.value }, {
                                    preserveScroll: true,
                                    preserveState: true,
                                    onSuccess: (page) => {
                                        setPosts(page.props.posts.data);
                                        setNextPageUrl(page.props.posts.next_page_url);
                                    },
                                });
                            }}
                        >
                            <option value="latest">{translations['Latest']}</option>
                            <option value="oldest">{translations['Oldest']}</option>
                            <option value="most_liked">{translations['Most Liked']}</option>
                            <option value="reposts">{translations['Reposts']}</option>
                        </select>
                        <button
                            onClick={handleReload}
                            aria-label={translations['Refresh posts']}
                            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {pinned_post && (
                    <div className="flex flex-col gap-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
                        <div className="flex items-center gap-1.5 pl-3 text-xs font-medium text-muted-foreground">
                            <Pin className="h-3.5 w-3.5" />
                            <span>{translations['Pinned'] || 'Pinned'}</span>
                        </div>
                        <PostComponent post={pinned_post} user={user} auth={auth} />
                    </div>
                )}

                <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                    {posts.length > 0 ? (
                        posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index < 15 ? index * 0.05 : 0 }}
                            >
                                <PostComponent post={post} user={user} auth={auth} />
                            </motion.div>
                        ))
                    ) : (
                        <EmptyState
                            icon={FileText}
                            title={translations['No posts yet.']}
                            description={isOwnProfile ? translations["Share your first thoughts with the world!"] : null}
                            actionLabel={isOwnProfile ? translations['Write your first post here'] : null}
                            actionHref={isOwnProfile ? '/dashboard' : null}
                        />
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
            </div>
        </AppLayout>
    );
}
