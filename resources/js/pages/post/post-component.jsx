import { Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart3,
    Bookmark,
    Check,
    EllipsisVertical,
    EyeOff,
    Heart,
    Link2,
    MessageCircle,
    Pencil,
    Pin,
    Quote,
    Repeat,
    Reply,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LinkifiedContent } from '../../components/linkified-content';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import '../../echo';
import { useDropdown } from '../../hooks/use-dropdown';
import { useInitials } from '../../hooks/use-initials';
import { usePostActions } from '../../hooks/use-post-actions';
import { fullDate, timeAgo } from '../../lib/time';
import { getMediaUrl, getProfileImageUrl } from '../../lib/utils';

const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -4 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -4 },
};

export default function PostComponent({ post, compact = false }) {
    const { processing } = useForm();
    const { auth, translations } = usePage().props;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handlePostClick = (e) => {
        if (compact) return;
        const target = e.target;
        if (target.closest('a, button, video, input, textarea, select, [role="button"]')) return;
        router.visit(`/post/${post.slug}`);
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/post/${post.slug}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success(translations['Link copied!'] || 'Link copied!');
        });
    };

    const handleDelete = () => {
        router.delete(`/post/${post.slug}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(translations['Post deleted'] || 'Post deleted');
                setShowDeleteDialog(false);
            },
        });
    };

    const getInitials = useInitials();
    const { isLiked, likesCount, isFavorited, favoritesCount, isReposted, repostsCount, handleLike, handleFavorite, handleRepost } =
        usePostActions(post);
    const { isOpen: showOptions, toggle: toggleOptions, close: closeOptions, ref: optionsRef } = useDropdown();

    const [commentsCount, setCommentsCount] = useState(post.comments_count);
    const [repliesCount] = useState(post.replies_count || 0);
    const [quotesCount] = useState(post.quotes_count || 0);
    const [pollData, setPollData] = useState(post.poll || null);

    useEffect(() => {
        setPollData(post.poll || null);
        setCommentsCount(post.comments_count);
    }, [post]);

    // Listen for new comments to update count in real-time
    useEffect(() => {
        if (compact) return;
        const channel = window.Echo.private(`post.${post.id}`);
        const handler = () => setCommentsCount((prev) => prev + 1);
        channel.listen('CommentCreated', handler);
        return () => {
            channel.stopListening('CommentCreated', handler);
        };
    }, [post.id, compact]);

    const handleVote = (optionId) => {
        if (!pollData || pollData.is_expired) return;
        const prevData = { ...pollData };
        const oldVoteOptionId = pollData.user_vote_option_id;
        const newOptions = pollData.options.map((o) => ({
            ...o,
            votes_count:
                o.id === optionId
                    ? o.votes_count + (oldVoteOptionId === optionId ? 0 : 1)
                    : o.id === oldVoteOptionId
                      ? o.votes_count - 1
                      : o.votes_count,
        }));
        setPollData({
            ...pollData,
            user_vote_option_id: optionId,
            total_votes: oldVoteOptionId ? pollData.total_votes : pollData.total_votes + 1,
            options: newOptions,
        });
        router.post(
            `/poll/${pollData.id}/vote`,
            { option_id: optionId },
            {
                preserveScroll: true,
                onError: () => setPollData(prevData),
            },
        );
    };

    const profileImageUrl = getProfileImageUrl(post.user);
    const displayTime = timeAgo(post.raw_created_at || post.created_at);
    const tooltipTime = fullDate(post.raw_created_at || post.created_at);

    return (
        <>
            <div
                onClick={handlePostClick}
                className={`relative ${compact ? 'bg-muted/30 border-border rounded-lg border p-3' : 'border-border bg-card cursor-pointer rounded-2xl border px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-6'}`}
            >
                {!compact && (post.reposted_by_you || post.reposted_by_recent?.length > 0) && (
                    <div className="mb-2 ml-[3.75rem] flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Repeat className="h-3.5 w-3.5" />
                        <span>
                            {post.reposted_by_you && (
                                <>
                                    <Link href={`/user/${post.current_user.username}`} className="font-medium hover:underline">
                                        {translations['You'] || 'You'}
                                    </Link>
                                    {post.reposted_by_recent?.length > 0 && ', '}
                                </>
                            )}
                            {post.reposted_by_recent?.map((user, index) => (
                                <span key={user.id}>
                                    <Link href={`/user/${user.username}`} className="font-medium hover:underline">
                                        {user.name}
                                    </Link>
                                    {index < post.reposted_by_recent.length - 1 && ', '}
                                </span>
                            ))}{' '}
                            {translations['reposted'] || 'reposted'}
                        </span>
                    </div>
                )}
                <div className="flex items-start space-x-3">
                    <Avatar className="mt-0.5 h-12 w-12">
                        <AvatarImage src={profileImageUrl} alt={post.user.name} />
                        <AvatarFallback className="rounded-full bg-gray-200 text-lg text-black dark:bg-gray-700 dark:text-white">
                            {getInitials(post.user.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex min-w-0 items-center gap-2">
                                <Link
                                    href={`/user/${post.user.username}`}
                                    className="truncate font-semibold text-gray-900 hover:underline dark:text-white"
                                >
                                    {post.user.name}
                                </Link>
                                {post.user.is_verified && (
                                    <div className="group relative -ml-1">
                                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                            Verified
                                        </span>
                                        <span className="flex items-center rounded-full bg-blue-500 p-0.5 text-xs font-medium text-white">
                                            <Check className="h-3 w-3" />
                                        </span>
                                    </div>
                                )}
                                <Link href={`/post/${post.slug}`} className="shrink-0 text-sm text-gray-500 hover:underline" title={tooltipTime}>
                                    {displayTime}
                                </Link>
                            </div>

                            {post.user.id === auth.user.id && (
                                <div className="relative" ref={optionsRef}>
                                    <button
                                        onClick={toggleOptions}
                                        aria-label={translations['Options']}
                                        className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
                                    >
                                        <EllipsisVertical className="h-6 w-6" />
                                    </button>
                                    <AnimatePresence>
                                        {showOptions && (
                                            <motion.div
                                                variants={dropdownVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 z-50 mt-1 min-w-[160px] origin-top-right rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                                            >
                                                <button
                                                    onClick={() => router.get(`/post/${post.slug}/edit`)}
                                                    className="flex w-full items-center gap-2 rounded-t-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-600"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    {translations['Edit']}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        router.post(`/post/${post.slug}/toggle-pin`, {}, { preserveScroll: true });
                                                        closeOptions();
                                                    }}
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-600"
                                                >
                                                    <Pin className="h-4 w-4" />
                                                    {post.is_pinned
                                                        ? translations['Unpin from profile'] || 'Unpin from profile'
                                                        : translations['Pin to profile'] || 'Pin to profile'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        closeOptions();
                                                        handleCopyLink();
                                                    }}
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-600"
                                                >
                                                    <Link2 className="h-4 w-4" />
                                                    {translations['Copy link'] || 'Copy link'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        closeOptions();
                                                        setShowDeleteDialog(true);
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {translations['Delete']}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">@{post.user.username}</p>
                        {post.parent_post && (
                            <Link
                                href={`/post/${post.parent_post.slug}`}
                                className="mt-1 block rounded-md border border-gray-100 px-3 py-2 transition hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                            >
                                <span className="flex items-center gap-1 text-xs text-blue-500">
                                    {translations['Replying to'] || 'Replying to'} @{post.parent_post.user.username}
                                </span>
                                {post.parent_post.content && (
                                    <p className="mt-0.5 line-clamp-2 text-xs break-words text-gray-500 dark:text-gray-400">
                                        {post.parent_post.content}
                                    </p>
                                )}
                            </Link>
                        )}
                        <p className={`mt-1 text-[16px] break-words text-gray-700 lg:text-lg dark:text-gray-300`}>
                            <LinkifiedContent content={post.content} />
                        </p>

                        {post.media.length > 0 && (
                            <div className="mt-2 grid grid-cols-1 gap-3 py-1 sm:grid-cols-2">
                                {post.media.map((file, index) => {
                                    const uniqueKey = `${post.id}-${file.id ?? file.file_path ?? index}`;
                                    const mediaUrl = getMediaUrl(file);

                                    return file.file_type === 'image' ? (
                                        <div
                                            key={uniqueKey}
                                            className="relative flex w-full items-center justify-center overflow-hidden rounded-lg border dark:border-gray-700"
                                        >
                                            <img
                                                src={mediaUrl}
                                                alt="Post Media"
                                                className="cursor-pointer object-contain transition-transform duration-300 hover:scale-102"
                                            />
                                        </div>
                                    ) : (
                                        <div key={uniqueKey} className="relative w-full overflow-hidden rounded-lg border dark:border-gray-700">
                                            <video controls className="h-auto w-full rounded-lg object-contain">
                                                <source src={mediaUrl} type="video/mp4" />
                                            </video>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {post.hashtags?.length > 0 && (
                            <div className="mt-0.5 flex flex-wrap gap-x-1 text-[16px] break-words">
                                {post.hashtags.map((hashtag) => (
                                    <Link key={hashtag.id} href={`/posts-by-hashtag/${hashtag.hashtag}`} className="text-blue-500 hover:underline">
                                        #{hashtag.hashtag}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {post.quote_post && (
                            <Link
                                href={`/post/${post.quote_post.slug}`}
                                className="mt-2 block overflow-hidden rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={getProfileImageUrl(post.quote_post.user)} alt={post.quote_post.user.name} />
                                        <AvatarFallback className="bg-gray-200 text-[10px] text-black dark:bg-gray-700 dark:text-white">
                                            {getInitials(post.quote_post.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{post.quote_post.user.name}</span>
                                    {post.quote_post.user.is_verified && (
                                        <span className="flex items-center rounded-full bg-blue-500 p-0.5 text-xs text-white">
                                            <Check className="h-2.5 w-2.5" />
                                        </span>
                                    )}
                                    <span className="truncate text-xs text-gray-500">@{post.quote_post.user.username}</span>
                                    <span
                                        className="shrink-0 text-xs text-gray-400"
                                        title={fullDate(post.quote_post.raw_created_at || post.quote_post.created_at)}
                                    >
                                        {timeAgo(post.quote_post.raw_created_at || post.quote_post.created_at)}
                                    </span>
                                </div>
                                <p className="mt-1 line-clamp-3 text-sm break-words text-gray-700 dark:text-gray-300">{post.quote_post.content}</p>
                                {post.quote_post.media?.length > 0 && post.quote_post.media[0]?.file_type === 'image' && (
                                    <img src={getMediaUrl(post.quote_post.media[0])} alt="" className="mt-2 h-32 w-full rounded-md object-cover" />
                                )}
                            </Link>
                        )}

                        {pollData && (
                            <div className="mt-3 rounded-xl border border-gray-100 p-3 dark:border-neutral-800">
                                <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                                    <BarChart3 className="h-4 w-4" />
                                    {translations['Poll'] || 'Poll'}
                                    {pollData.is_expired && (
                                        <span className="ml-1 text-xs text-red-500">({translations['Expired'] || 'Expired'})</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {pollData.options.map((option) => {
                                        const hasVoted = pollData.user_vote_option_id != null;
                                        const isSelected = pollData.user_vote_option_id === option.id;
                                        const percentage =
                                            pollData.total_votes > 0 ? Math.round((option.votes_count / pollData.total_votes) * 100) : 0;
                                        const showResults = hasVoted || pollData.is_expired;

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => !pollData.is_expired && handleVote(option.id)}
                                                disabled={pollData.is_expired}
                                                aria-disabled={pollData.is_expired}
                                                className={`relative w-full overflow-hidden rounded-md border px-3 py-2 text-left text-sm transition ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                                                        : 'border-gray-200 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                                                } ${pollData.is_expired ? 'cursor-default' : 'cursor-pointer'}`}
                                            >
                                                {showResults && (
                                                    <div
                                                        className="absolute inset-y-0 left-0 bg-blue-100 transition-all duration-300 dark:bg-blue-900/30"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                )}
                                                <div className="relative flex items-center justify-between">
                                                    <span
                                                        className={`${isSelected ? 'font-medium text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                                                    >
                                                        {option.text}
                                                    </span>
                                                    {showResults && (
                                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{percentage}%</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    {pollData.total_votes}{' '}
                                    {pollData.total_votes === 1 ? translations['vote'] || 'vote' : translations['votes'] || 'votes'}
                                    {pollData.expires_at && !pollData.is_expired && (
                                        <span className="ml-1">
                                            &middot; {translations['Ends'] || 'Ends'} {new Date(pollData.expires_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}

                        {!compact && (
                            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-500 sm:gap-x-3 dark:text-gray-400">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleLike}
                                    disabled={processing}
                                    aria-label={isLiked ? translations['Unlike'] : translations['Like']}
                                    className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                                >
                                    <Heart className="h-4 w-4 transition-transform sm:h-5 sm:w-5" fill={isLiked ? 'currentColor' : 'none'} />
                                    <span className="text-sm">{likesCount}</span>
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => router.visit(`/post/${post.slug}`)}
                                    aria-label={translations['Comments']}
                                    className="flex items-center gap-1 transition-colors hover:text-blue-500"
                                >
                                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-sm">{commentsCount}</span>
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleFavorite}
                                    disabled={processing}
                                    aria-label={isFavorited ? translations['Remove from favorites'] : translations['Add to favorites']}
                                    className={`flex items-center gap-1 transition-colors ${isFavorited ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
                                >
                                    <Bookmark className="h-4 w-4 transition-transform sm:h-5 sm:w-5" fill={isFavorited ? 'currentColor' : 'none'} />
                                    <span className="text-sm">{favoritesCount}</span>
                                </motion.button>
                                {post.user.id !== auth.user.id && !post.is_private && !post.user.is_private && (
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleRepost}
                                        disabled={processing}
                                        aria-label={isReposted ? translations['Undo repost'] : translations['Repost']}
                                        className={`flex items-center gap-1 transition-colors ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
                                    >
                                        <Repeat className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm">{repostsCount}</span>
                                    </motion.button>
                                )}
                                {!post.is_private && (
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => router.visit(`/dashboard?quote=${post.slug}`)}
                                        aria-label={translations['Quote']}
                                        className="flex items-center gap-1 transition-colors hover:text-purple-500"
                                    >
                                        <Quote className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm">{quotesCount}</span>
                                    </motion.button>
                                )}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => router.visit(`/dashboard?reply=${post.slug}`)}
                                    aria-label={translations['Reply'] || 'Reply'}
                                    className="flex items-center gap-1 transition-colors hover:text-blue-500"
                                >
                                    <Reply className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-sm">{repliesCount}</span>
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleCopyLink}
                                    aria-label={translations['Copy link'] || 'Copy link'}
                                    className="ml-auto flex items-center gap-1 transition-colors hover:text-blue-500"
                                >
                                    <Link2 className="h-4 w-4" />
                                </motion.button>
                                {post.is_private === 1 && <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" aria-label={translations['Private post']} />}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{translations['Delete post'] || 'Delete post'}</DialogTitle>
                        <DialogDescription>
                            {translations['Are you sure you want to delete this post? This action cannot be undone.'] ||
                                'Are you sure you want to delete this post? This action cannot be undone.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            {translations['Cancel'] || 'Cancel'}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                            {translations['Delete'] || 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
